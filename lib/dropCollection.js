import { getVersion } from "./getDbVersion.js";

export const dropCollection = (databaseName, collectionName) => {
    return new Promise(async (resolve, reject) => {
        try {
            let version = await getVersion(databaseName);
            version++; // increment version to trigger upgrade
            const request = indexedDB.open(databaseName, version);

            request.onupgradeneeded = (event) => {
                console.log("dropping collection....");
                const db = request.result;
                db.deleteObjectStore(collectionName);
            };
            request.onerror = () => {
                throw new Error(`Mongrowser.Collection.dropCollection Error`);
            }
            request.onsuccess = (event) => {
                console.log("collection dropped....");
                const db = request.result;
                db.close();
                resolve(true);
            }
            
        } catch(error){
            console.error(`Mongrowser Error: Collection.dropCollection: ${error.message}`);
            resolve(false);
        }
    });
}