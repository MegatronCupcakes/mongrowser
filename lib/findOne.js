import { db } from "../util/db.js";
import { queryEvaluator } from "./queryEvaluator.js";
import { getOptionDetails } from "../util/getOptionDetails.js";
import { applyProjections } from "../util/applyProjections.js";

export const findOne = (databaseName, objectStoreName, searchObject, optionsObject) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (typeof searchObject === 'string') searchObject = JSON.parse(searchObject);
            if (typeof optionsObject === 'string') optionsObject = JSON.parse(optionsObject);
            const evaluations = queryEvaluator(searchObject ? searchObject : {});                
            const [sortIndex, sortKeyword, skip, limit, removeFields, returnFields, projections] = getOptionDetails(optionsObject);
            const _cursorRequest = sortIndex ?
                db(databaseName, objectStoreName, 'readonly').index(sortIndex).openCursor(null, sortKeyword)
                :
                db(databaseName, objectStoreName, 'readonly').openCursor();
            _cursorRequest.onsuccess = async ({ target }) => {
                const _cursor = target.result;
                if (_cursor) {
                    if (evaluations.map(test => test(_cursor.value)).every(bool => bool)) {
                        resolve(applyProjections(_cursor.value, searchObject, removeFields, returnFields, projections));
                    } else {
                        _cursor.continue();
                    }
                } else {
                    resolve(null);
                }
            }
        } catch (error) {
            reject(error);
        }
    });
}