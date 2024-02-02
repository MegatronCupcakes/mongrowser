import { db } from "../util/db.js";
import { queryEvaluator } from "./queryEvaluator.js";
import { getOptionDetails } from "../util/getOptionDetails.js";
import { applyFieldProjection } from "../util/applyFieldProjections.js";
import { recursiveKeySearch } from "../util/recursiveKeySearch.js";
import { domStringListToArray } from "../util/domStringListToArray.js";

export const find = (databaseName, objectStoreName, searchObject, optionsObject) => {
    return new Promise(async (resolve, reject) => {
        try {
            // some search types require special handling
            if(recursiveKeySearch(searchObject, '$text')){
                _handleTextSearch(databaseName, objectStoreName, searchObject, optionsObject, resolve, reject);                
            } 
            // proceed with standard search
            else {
                const options = getOptionDetails(optionsObject);
                const [sortIndex, sortKeyword, skip, limit, removeFields, returnFields] = options;
                const _cursorRequest = sortIndex ?
                    db(databaseName, objectStoreName, 'readonly').index(sortIndex).openCursor(null, sortKeyword)
                    :
                    db(databaseName, objectStoreName, 'readonly').openCursor();
                _find(_cursorRequest, options, searchObject, optionsObject, null, resolve, reject);
            }                        
        } catch (error) {
            console.log(`FIND ERROR: ${error.message}`);
            reject(error);
        }
    });
}

const _find = (cursorRequest, options, searchObject, optionsObject, cursorKeyTest, resolve, reject) => {
    try {
        let results = [];
        if (typeof searchObject === 'string') searchObject = JSON.parse(searchObject);
        if (typeof optionsObject === 'string') optionsObject = JSON.parse(optionsObject);                
        
        const evaluations = queryEvaluator(searchObject ? searchObject : {});
        
        const [sortIndex, sortKeyword, skip, limit, removeFields, returnFields] = options;
        let _cursorCount = 1;
        cursorRequest.onsuccess = async ({ target }) => {
            try {
                const _cursor = target.result;
                if ((_cursor && !limit) || (_cursor && limit && _cursorCount <= limit)) {
                    const passedKeyTest = cursorKeyTest ? cursorKeyTest(_cursor.key) : true;
                    if(searchObject == {} && cursorKeyTest && passedKeyTest){
                        if (!skip || _cursorCount > skip) results.push(await applyFieldProjection(_cursor.value, removeFields, returnFields));
                    } else {
                        if (evaluations.map(test => test(_cursor.value)).every(bool => bool) && passedKeyTest) {
                            if (!skip || _cursorCount > skip) results.push(await applyFieldProjection(_cursor.value, removeFields, returnFields));                            
                        }
                    }            
                    _cursorCount++;
                    _cursor.continue();
                } else {
                    resolve(results);
                }
            } catch(_error){
                reject(_error);
            }            
        }
    } catch(error){
        reject(error);
    }    
}

const _handleTextSearch = async (databaseName, objectStoreName, searchObject, optionsObject, resolve, reject) => {    
    try {
        const searchValue = searchObject.$text.$search;
        const options = getOptionDetails(optionsObject);
        delete searchObject.$text;
    
        // try to replicate Mongo's collection-wide text index by searching multiple IndexedDb indices
        const objectStore = db(databaseName, objectStoreName, 'readonly');
        const indices = domStringListToArray(objectStore.indexNames).filter(index => index.includes('$text'));                                    
        const cursorKeyTest = key => key.includes(searchValue);
        
        let results = await Promise.all(indices.map(indexName => {
            return new Promise((_resolve, _reject) => {
                const _cursorRequest = db(databaseName, objectStoreName, 'readonly').index(indexName).openCursor();        
                _find(_cursorRequest, options, searchObject, optionsObject, cursorKeyTest, _resolve);
            });
        }));
        const idSet = new Set();
        results = results.flat().filter(result => {
            if(!idSet.has(result._id)){
                idSet.add(result._id);
                return true;
            }
            return false;
        });                
        resolve(results);
    } catch (error) {
        reject(error);
    }
}