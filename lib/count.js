import { db } from "../util/db.js";

export const count = (databaseName, objectStoreName) => {
    return new Promise((resolve, reject) => {
        try {
            const _countRequest = db(databaseName, objectStoreName, 'readonly').count();
            _countRequest.onerror = error => reject(error);                
            _countRequest.onsuccess = () => {
                resolve(_countRequest.result);
            }                
        } catch (error) {
            reject(error);
        }
    });
}