import { init } from "./init.js";

export const createIndex = (databaseName, objectStoreName, indexFields) => {
    return new Promise(async (resolve, reject) => {
        try {            
            let initialized = false;
            initialized = await init(databaseName, objectStoreName, indexFields);
            resolve(initialized);
        } catch(error){
            reject(error);
        }
    });    
}