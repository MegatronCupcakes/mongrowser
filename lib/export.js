import { find } from "./find.js";

// if no objectStoreNames are provided, export all collections for databaseName
export const exportJson = (databaseName, objectStoreNames) => {
    return new Promise(async (resolve, reject) => {
        try {
            const today = new Date();
            if(!objectStoreNames || (Array.isArray(objectStoreNames) && objectStoreNames.length == 0)){
                objectStoreNames = await _getObjectStoreNames(databaseName);
            }
            const dataSets = await Promise.all(objectStoreNames.map(objectStoreName => find(databaseName, objectStoreName, {})));
            let dump = {};
            dataSets.forEach((dataSet, index) => {
                dump[objectStoreNames[index]] = dataSet;
            });
            const stringifiedDataSet = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dump, null, 4));
            let downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.style.display = 'none';
            downloadAnchorNode.setAttribute("href", stringifiedDataSet);
            downloadAnchorNode.setAttribute("download", `WorkoutTracker_${today.toLocaleDateString('en-US').split("/").join("-")}.json`);
            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
            resolve(true);
        } catch (error) {
            console.error(`DBAccess.export ERROR: ${error.message}`);
            resolve(false);
        }
    });
}

const _getObjectStoreNames = (databaseName) => {
    return new Promise((resolve, reject) => {
        try {
            const openRequest = window.indexedDB.open(databaseName);
            openRequest.onerror = (event) => {
                reject(`could not open database: ${databaseName}`);
            }
            openRequest.onsuccess = (event) => {
                const db = openRequest.result;
                const objectStoreNames = db.objectStoreNames;
                db.close();
                resolve(objectStoreNames);
            }
        } catch(error){
            reject(error);
        }
    });
}