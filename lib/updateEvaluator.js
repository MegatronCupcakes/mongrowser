import { isNumeric } from "../util/isNumeric.js";

export const updateDocument = (originalDocument, updateObject) => {
    let original = { ...originalDocument };
    Object.keys(updateObject).forEach(key => {
        Object.keys(updateObject[key]).forEach(updateKey => {
            _handleUpdate(original, key, updateKey, updateObject[key][updateKey]);
        });
    });
    return original;
}
const _handleUpdate = (original, action, updateKey, updateValue) => {
    let tempDocument = original;
    const subKeys = updateKey.split(".");
    for (let index = 0; index < subKeys.length; index++) {
        if (index < subKeys.length - 1) {
            if (!tempDocument[subKeys[index]]) tempDocument[subKeys[index]] = {};
        } else {
            
            switch (action) {
                // Field Update Operators                  
                // case '$currentDate':                    
                    // implemented in util/convertValueObject.js
                    // break;
                case '$inc':                    
                if (isNumeric(updateValue)) tempDocument[subKeys[index]] = original[subKeys[index]] + updateValue;
                    break;
                case '$min':                    
                    if (isNumeric(updateValue) && updateValue > original[subKeys[index]]) tempDocument[subKeys[index]] = updateValue;
                    break;
                case '$max':
                    if (isNumeric(updateValue) && updateValue < original[subKeys[index]]) tempDocument[subKeys[index]] = updateValue;
                    break;
                case '$mul':                    
                    if (isNumeric(updateValue)) tempDocument[subKeys[index]] = original[subKeys[index]] * updateValue;
                    break;
                case '$rename':
                    const value = tempDocument[subKeys[index]];
                    delete tempDocument[subKeys[index]];
                    tempDocument[updateValue] = value;
                    break;
                case '$set':
                    if(typeof updateValue == 'object' && !(updateValue instanceof Date)){
                        const subAction = Object.keys(updateValue)[0];                                              
                        _handleUpdate(original, subAction, updateKey, updateValue[subAction]);
                    } else {
                        tempDocument[subKeys[index]] = updateValue;
                    }                    
                    break;
                case '$setOnInsert':
                    // implemented in update.js
                    break;
                case '$unset':
                    delete tempDocument[subKeys[index]];
                    break;
                // Array Update Operators
                case '$':
                    // Not implemented
                    break;
                case '$[]':
                    // Not implemented
                    break;
                case '$[<identifier>]':
                    // Not implemented
                    break;
                case '$addToSet':
                    if (Array.isArray(tempDocument[subKeys[index]])) {
                        if (typeof updateValue == 'object' && Object.keys(updateValue)[0] == '$each' && Array.isArray(updateValue['$each'])) {
                            updateValue['$each'].forEach(_value => {
                                if (tempDocument[subKeys[index]].indexOf(_value) == -1) tempDocument[subKeys[index]].push(_value);
                            });
                        } else if (tempDocument[subKeys[index]].indexOf(updateValue) == -1) {
                            tempDocument[subKeys[index]].push(updateValue);
                        }
                    }
                    break;
                case '$pop':
                    if (Array.isArray(tempDocument[subKeys[index]])) {
                        if (updateValue == 1) tempDocument[subKeys[index]].shift();
                        if (updateValue == -1) tempDocument[subKeys[index]].pop();
                    }
                    break;
                case '$pull':
                    let _testSearchObject = {};
                    _testSearchObject[subKeys[index]] = updateValue;

                    const _test = typeof updateValue == 'object'
                        ?
                        testItem => {
                            // To re-use our query evaluations, we need to wrap the test term in an object matching the search term.
                            let _testObject = {};
                            _testObject[subKeys[index]] = testItem;
                            return !_queryEvaluator(_testSearchObject)[0](_testObject)
                        }
                        :
                        testItem => testItem != updateValue;

                    tempDocument[subKeys[index]] = tempDocument[subKeys[index]].filter(arrayItem => {
                        return _test(arrayItem);
                    });
                    break;
                case '$push':
                    if (Array.isArray(tempDocument[subKeys[index]])) {
                        if (typeof updateValue == 'object') {
                            let _updateSlice;
                            let _updatePosition;
                            let _updateSort;
                            let _updateArray = [];
                            if (updateValue['$slice'] && isNumeric(updateValue['$slice'])) {
                                _updateSlice = updateValue['$slice'];
                            }
                            if (updateValue['$position'] && isNumeric(updateValue['$position'])) {
                                _updatePosition = updateValue['$position'];
                            }
                            if (updateValue['$sort'] && isNumeric(updateValue['$sort'])) {
                                _updateSort = updateValue['$sort'];
                            }
                            if (Array.isArray(updateValue['$each']) && Array.isArray(updateValue['$each'])) {
                                _updateArray = updateValue['$each'];
                            }
                            let _update = [
                                ...tempDocument[subKeys[index]].slice(0, _updatePosition),
                                ..._updateArray,
                                ...tempDocument[subKeys[index]].slice(_updatePosition)
                            ];
                            if (_updateSlice) _update = _update.slice(_updateSlice);
                            if (_updateSort) {
                                if (isNumeric(_updateSort) && Math.abs(_updateSort) == 1) {
                                    if (_update.every(item => isNumeric(item))) {
                                        // sort numbers
                                        _update.sort((a, b) => a - b);
                                    } else {
                                        // sort strings
                                        _update.sort();
                                    }
                                    if (_updateSort == -1) _update.reverse();
                                } else if (typeof _updateSort == 'object') {
                                    // sort documents by property
                                    let _sortField = Object.keys(_updateSort)[0];
                                    let _sortDirection = _updateSort[_sortField];
                                    if (isNumeric(_sortDirection) && Math.abs(_sortDirection) == 1) {
                                        _update.sort((a, b) => {
                                            // account for dot notation....
                                            _sortField.split('.').forEach(key => {
                                                a = a[key];
                                                b = b[key];
                                            });
                                            if (a > b) return 1;
                                            if (a < b) return -1;
                                            return 0;
                                        });
                                        if (_sortDirection == -1) _update.reverse();
                                    }
                                }
                            }
                            tempDocument[subKeys[index]] = _update;
                        } else {
                            tempDocument[subKeys[index]].push(updateValue);
                        }
                    }
                    break;
                case '$pullAll':
                    // this looks logically identical to $pull: {$in: [...]}
                    _handleUpdate(original, '$pull', updateKey, { $in: updateValue });
                    break;
                //case '$each':
                // works with $addToSet and $push...
                // implemented by $addToSet and $push
                //case '$position':
                // works with $push...
                // implemented by $push
                //case '$slice':
                // works with $push...
                // implemented by $push
                //case '$sort':
                // works with $push...
                // implemented by $push
                // Bitwise Update Operator - not implemented    
                default:
                    tempDocument[subKeys[index]] = updateValue;
                    break;            
            }
        }
        tempDocument = tempDocument[subKeys[index]];
    }
    return original
}