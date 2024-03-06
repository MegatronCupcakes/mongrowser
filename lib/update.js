import { db } from "../util/db.js";
import { find } from "./find.js";
import { findOne } from "./findOne.js";
import { insert } from "./insert.js";
import { updateDocument } from "./updateEvaluator.js";
import { convertValueObject } from "../util/convertValueObject.js";

export const update = (databaseName, objectStoreName, searchObject, updateObject, optionsObject) => {
    return new Promise(async (resolve, reject) => {
        try {                
            if (typeof searchObject === 'string') searchObject = JSON.parse(searchObject);
            if (typeof updateObject === 'string') updateObject = JSON.parse(updateObject);
            if (typeof optionsObject === 'string') optionsObject = JSON.parse(optionsObject);
            searchObject = convertValueObject(searchObject);
            updateObject = convertValueObject(updateObject);
            optionsObject = convertValueObject(optionsObject);



            // allow for updating multiple documents with "multi" option;
            let _matchingDocuments = [];
            if(optionsObject && Object.hasOwn(optionsObject, 'multi') && optionsObject[multi] == true){
                console.log(`multi yo!`)
                _matchingDocuments = await find(databaseName, objectStoreName, searchObject);
            } else {
                _matchingDocuments = [await findOne(databaseName, objectStoreName, searchObject)];
            }


            
            await Promise.all(_matchingDocuments.map(_matchingDocument => {
                return new Promise(async (_resolve, _reject) => {
                    if(_matchingDocument == null && Object.hasOwn(updateObject, '$setOnInsert')){                        
                        const insertedId = await insert(databaseName, objectStoreName, updateObject.$setOnInsert)
                        .catch(_error => {
                            console.log(`setOnInsert error: ${_error.message}; tried to insert: ${JSON.stringify(updateObject.$setOnInsert)}`);
                            _reject(_error);
                        });
                        _resolve();
                    } else {
                        let _updatedDocument = updateDocument(_matchingDocument, updateObject);
                        // disallow updating the _id property by setting it back to its pre-update value.
                        _updatedDocument._id = _matchingDocument._id;
                        _updatedDocument.updatedAt = (new Date()).toISOString();
                        const _updateRequest = db(databaseName, objectStoreName, 'readwrite').put(_updatedDocument);
                        _updateRequest.onerror = error => _reject();
                        _updateRequest.onsuccess = () => _resolve();
                    }                    
                });
            }));
            resolve(true);
        } catch (error) {
            resolve(false);
        }
    });
}