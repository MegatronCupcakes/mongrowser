import { db } from "../util/db.js";
import { findOne } from "./findOne.js";

export const insert = (databaseName, objectStoreName, document) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (typeof document === 'string') document = JSON.parse(document);
            // if document._id is provided and not already used, use the provided value; otherwise generate a new value.
            const _keyIsUnique = document._id && (await findOne(databaseName, objectStoreName, { _id: document._id })) == null;
            const _request = db(databaseName, objectStoreName, 'readwrite').add({
                _id: _keyIsUnique ? document._id : crypto.randomUUID(),
                ...document,
                createdAt: !document.createdAt ? (new Date()).toISOString() : document.createdAt
            });
            _request.onerror = _error => reject(_error);
            _request.onsuccess = () => {
                resolve(_request.result);
            };
        } catch(error){
            reject(error);
        }        
    });
}