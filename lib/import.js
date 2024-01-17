import { find } from "./find.js";
import { remove } from "./remove.js";
import { insert } from "./insert.js";

export const importJson = (databaseName, collectionName, importData) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (typeof importData === 'string') importData = JSON.parse(importData);

            //if an array of records is provided, create an object with the collection name as an array property
            const collections = collectionName ? [collectionName] : Object.keys(importData);
            if(Array.isArray(importData)){
                let _importData = {};
                _importData[collectionName] = [...importData];
                importData = _importData;
            }
            collections.forEach(async collectionName => {
                // remove existing documents
                const documentIds = (await find(databaseName, collectionName, {})).map(document => document._id);
                await Promise.all(documentIds.map(_id => remove(databaseName, collectionName, { _id: _id })));
                // insert new documents
                await Promise.all(importData[collectionName].map(document => insert(databaseName, collectionName, document)));
                resolve(true);
            });
        } catch (error) {
            console.error(`Mongrowser.import [${databaseName} ${collectionName}] ERROR: ${error.message}`);
            resolve(false);
        }
    })
}