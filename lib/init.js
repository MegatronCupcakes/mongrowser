export const init = (databaseName, objectStoreName, indexFieldArray) => {
    return new Promise(async (resolve, reject) => {
        try {                
            let _database, version;                            
            if (typeof indexFieldArray === 'string') indexFieldArray = JSON.parse(indexFieldArray);

            // request most recent version
            version = await new Promise((_resolve, _reject) => {
                const _request = window.indexedDB.open(databaseName);
                _request.onsuccess = (event) => {
                    const __database = event.target.result;
                    const __version = __database.version;
                    __database.close();
                    _resolve(__version);
                };
                _request.onerror = (_error) => _reject(_error);
            });

            // determine if we need to create a new ObjectStore via upgrade
            if(objectStoreName){
                version = await new Promise((_resolve, _reject) => {
                    let __version = version;
                    const _upgradeQueryRequest = window.indexedDB.open(databaseName, version);
                    _upgradeQueryRequest.onsuccess = (event) => {
                        const __database = event.target.result;
                        const _names = Object.keys(__database.objectStoreNames).map(key => __database.objectStoreNames[key]);
                        if (_names.indexOf(objectStoreName) == -1) {
                            // object store not found; indicate upgrade needed by incrementing version number
                            ++__version;
                        }
                        __database.close();
                        _resolve(__version);
                    }
                    _upgradeQueryRequest.onerror = (_error) => _reject(_error);
                });
            }
            
            const _openRequest = window.indexedDB.open(databaseName, version);
            _openRequest.onupgradeneeded = (event) => {
                // an ObjectStore can only be created from an onupgradeneeded event
                const _objectStore = event.target.result.createObjectStore(objectStoreName, { keyPath: "_id" });
                if (Array.isArray(indexFieldArray)) {
                    indexFieldArray.forEach(field => _objectStore.createIndex(field, field, { unique: false }));
                }
            };
            _openRequest.onblocked = (event) => {
                // an open database connection blocks the upgrade; close the connection to continue
                event.target.result.close();
            };
            _openRequest.onerror = () => {                    
                reject(false);
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