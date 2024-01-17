import { db } from "../util/db.js";
import { queryEvaluator } from "./queryEvaluator.js";
import { getOptionDetails } from "../util/getOptionDetails.js";
import { applyFieldProjection } from "../util/applyFieldProjections.js";

export const find = (databaseName, objectStoreName, searchObject, optionsObject) => {
    return new Promise(async (resolve, reject) => {
        try {                
            let results = [];
            if (typeof searchObject === 'string') searchObject = JSON.parse(searchObject);
            if (typeof optionsObject === 'string') optionsObject = JSON.parse(optionsObject);                
            const evaluations = queryEvaluator(searchObject ? searchObject : {});                
            const [sortIndex, sortKeyword, skip, limit, removeFields, returnFields] = getOptionDetails(optionsObject);
            let _cursorCount = 1;
            const _cursorRequest = sortIndex ?
                db(databaseName, objectStoreName, 'readonly').index(sortIndex).openCursor(null, sortKeyword)
                :
                db(databaseName, objectStoreName, 'readonly').openCursor();
            _cursorRequest.onsuccess = async ({ target }) => {
                const _cursor = target.result;
                if ((_cursor && !limit) || (_cursor && limit && _cursorCount <= limit)) {
                    if (evaluations.map(test => test(_cursor.value)).every(bool => bool)) {
                        if (!skip || _cursorCount > skip) results.push(await applyFieldProjection(_cursor.value, removeFields, returnFields));                            
                    }
                    _cursorCount++;
                    _cursor.continue();
                } else {
                    resolve(results);
                }
            }
        } catch (error) {
            reject(error);
        }
    });
}