import { db } from "../util/db.js";

export const remove = (databaseName, objectStoreName, searchObject) => {
    // currently restricted to remove single record by _id only.
    return new Promise((resolve, reject) => {
        try {
            if (typeof searchObject === 'string') searchObject = JSON.parse(searchObject);
            if (!searchObject._id) resolve(false);
            const _request = db(databaseName, objectStoreName, 'readwrite').delete(searchObject._id);
            _request.onerror = error => resolve(false);
            _request.onsuccess = () => resolve(true);
        } catch (error) {
            reject(error);
        }            
    });

}