import { db } from "../util/db.js";
import { find } from "./find.js";
import { updateDocument } from "./updateEvaluator.js";

export const update = (databaseName, objectStoreName, searchObject, updateObject) => {
    return new Promise(async (resolve, reject) => {
        try {                
            if (typeof searchObject === 'string') searchObject = JSON.parse(searchObject);
            if (typeof updateObject === 'string') updateObject = JSON.parse(updateObject);                
            // allow for updating multiple documents ("multi" option not implemented yet);
            const _matchingDocuments = await find(databaseName, objectStoreName, searchObject);
            await Promise.all(_matchingDocuments.map(_matchingDocument => {
                return new Promise((_resolve, _reject) => {
                    let _updatedDocument = updateDocument(_matchingDocument, updateObject);
                    // disallow updating the _id property by setting it back to its pre-update value.
                    _updatedDocument._id = _matchingDocument._id;
                    _updatedDocument.updatedAt = (new Date()).toISOString();
                    const _updateRequest = db(databaseName, objectStoreName, 'readwrite').put(_updatedDocument);
                    _updateRequest.onerror = error => _reject();
                    _updateRequest.onsuccess = () => _resolve();
                });
            }));
            resolve(true);
        } catch (error) {
            resolve(false);
        }
    });
}