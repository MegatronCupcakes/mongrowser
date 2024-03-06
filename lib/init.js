import { getVersion } from "./getDbVersion.js";

const maxRetries = 50;
const showRetryMessage = false;

export const init = (databaseName, objectStoreName, indexFieldArray) => {    
    return new Promise(async (resolve, reject) => {
        try {                
            let _database, version;
            let newCollection, newIndex = false;            

            if (typeof indexFieldArray === 'string') indexFieldArray = JSON.parse(indexFieldArray);
            
            // close existing connection
            if(window._databases && window._databases[databaseName]) window._databases[databaseName].close();         

            // request most recent version
            version = await getVersion(databaseName);
                        
            // determine if we need to create a new ObjectStore via upgrade
            if(objectStoreName){
                version = await new Promise((_resolve, _reject) => {
                    let __version = version;
                    const _upgradeQueryRequest = window.indexedDB.open(databaseName, version);
                    _upgradeQueryRequest.onsuccess = (event) => {
                        const __database = event.target.result;
                        const _names = Object.keys(__database.objectStoreNames).map(key => __database.objectStoreNames[key]);
                        if (_names.indexOf(objectStoreName) == -1) {
                            // object store not found; create new collection
                            newCollection = true;
                        }
                        if(Array.isArray(indexFieldArray) && indexFieldArray.length > 0){
                            // check indexFieldArray to see if it contains a new field to index
                            const _transaction = __database.transaction(objectStoreName, 'readonly');
                            const _objectStore = _transaction.objectStore(objectStoreName);
                            // note: IDBObjectStore.indexNames is a DOMStringList and not an array
                            if(!indexFieldArray.every(_indexName => _objectStore.indexNames.contains(_indexName))){
                                newIndex = true;
                            }
                        }
                        if(newCollection || newIndex) ++__version;
                        __database.close();
                        _resolve(__version);
                    }
                    _upgradeQueryRequest.onerror = (_error) => _reject(_error);
                });
            }

            const _openRequest = window.indexedDB.open(databaseName, version);
            _openRequest.onupgradeneeded = (event) => {
                try {
                    const db = event.target.result;
                    if(newCollection){
                        // an ObjectStore can only be created from an onupgradeneeded event
                        db.createObjectStore(objectStoreName, { keyPath: "_id" });
                    }
                    if(newIndex){
                        const _transaction = event.target.transaction;
                        const _objectStore = _transaction.objectStore(objectStoreName);
                        indexFieldArray.forEach(field => {
                            let indexName = field;
                                try {
                                    field = JSON.parse(field);    
                                } catch(_error){
                                    // just treat field like a string
                                }                                
                                if(typeof field == 'object'){
                                    let _fieldName = Object.keys(field)[0];
                                    let _indexType = field[_fieldName];
                                    indexName = indexName = `$${_indexType}_${_fieldName}`;
                                    field = _fieldName;
                                }
                                try {
                                    // delete any previous index.
                                    _objectStore.deleteIndex(indexName);
                                } catch(error){
                                    // no pre-existing index
                                }                                
                                _objectStore.createIndex(indexName, field, { unique: false });
                        });                        
                    }
                } catch(error){                    
                    throw new Error(error);
                }                                
            };
            _openRequest.onblocked = (event) => {
                // an open database connection blocks the upgrade; close the connection to continue                
                for(let i = 0, closed = false; !closed && i < maxRetries; i++){
                    try {
                        event.target.result.close();
                        closed = true;
                    } catch(error){
                        if(i == maxRetries - 1 && showRetryMessage) console.log(`onblocked closed: ${error.message} (final attempt)`);
                    }
                }                
            };
            _openRequest.onerror = () => {
                throw new Error('Mongrowser Init Error: could not complete initialization');
            };
            _openRequest.onsuccess = (event) => {                    
                _database = event.target.result;
                if(!window._databases) window._databases = {};
                window._databases[databaseName] = _database;                
                resolve(true);
            };                
        } catch (error) {
            console.error(`DBAccess.init Error: ${error.message}; databaseName: "${databaseName}", objectStoreName: ${objectStoreName}, indexFieldArray: "${JSON.stringify(indexFieldArray)}"`);
            reject(false);
        }
    });
}