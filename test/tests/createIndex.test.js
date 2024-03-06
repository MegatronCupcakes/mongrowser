import Mongrowser from "mongrowser";
import { getSeeds } from "../util/seed.js";
import _ from "underscore";
import "mocha";

const assert = chai.assert;

describe('Create Collection Index', function(){

    this.timeout(5 * 60 * 1000);

    const databaseName = 'mongrowser_test_database';
    const indices = [
        'name',
        {name: "text"}
    ];
    let database;
    const seeds = getSeeds();
    
    before(function(){
        return new Promise(async (resolve, reject) => {
            try {
                database = new Mongrowser(databaseName);
                await database.import(seeds);
                const collectionNames = Object.keys(seeds);
                for(let i = 0; i < collectionNames.length; i++){
                    const collectionName = collectionNames[i];
                    const collection = await database.getCollection(collectionName);
                    for(let _i = 0; _i < indices.length; _i++){                        
                        const indexed = await collection.createIndex(indices[_i]);
                    }
                }
                resolve();
            } catch(error){
                reject(error);
            }
        });        
    });
    
    it('create indices', () => {
        return new Promise(async (resolve, reject) => {
            try {
                const expectedIndices = indices.map(index => {                     
                    if(typeof index == 'object'){
                        let _fieldName = Object.keys(index)[0];
                        let _indexType = index[_fieldName];
                        return `$${_indexType}_${_fieldName}`;
                    }
                    return index;
                });
                const collectionNames = Object.keys(seeds);                
                assert(collectionNames.every(async collectionName => {                    
                    return new Promise((_resolve) => {
                        const _dbRequest = window.indexedDB.open(databaseName);
                        _dbRequest.onsuccess = (event) => {
                            const _database = event.target.result;
                            const _transaction = _database.transaction(collectionName, 'readonly');
                            const _objectStore = _transaction.objectStore(collectionName);
                            // note: IDBObjectStore.indexNames is a DOMStringList and not an array                                                       
                            _resolve(expectedIndices.every(_indexName => {
                                return _objectStore.indexNames.contains(_indexName);
                            }));
                        }
                        _dbRequest.onerror = _error => {
                            _resolve(false);
                        };
                    });
                }), `indices not found`);
                resolve();
            } catch(error){
                console.log(`ERROR: ${error.message}`);
                reject(error);
            }
        });        
    });
    
});