import { convertToBool } from '../util/convertToBool.js';
import { prettyPrint } from "../util/prettyPrint.js";

export const queryEvaluator = (searchObject) => {    
    let testArray = [];
    const _evaluationForKey = (_key, _searchObject, _parentKeys, _parentObject) => {
        if (!_parentKeys) _parentKeys = [];
        if (!_parentObject) _parentObject = _searchObject;

        const _getValues = (__searchObject, __testedRecord, __key, __parentKeys) => {
            if (__parentKeys) __parentKeys.forEach(__parentKey => __searchObject = __searchObject[__parentKey]);
            const __searchValue = __searchObject[__key];
            if (__parentKeys.length == 0) __parentKeys = [__key];
            let __testedValue = __testedRecord;
            __parentKeys.forEach(__parentKey => {
                __testedValue = __testedValue[__parentKey];
            });
            return [__searchValue, __testedValue];
        }

        const _throwNotImplemented = () => {
            throw new Error(`Mongrowser Collection.find: "${_key}" not implemented (yet)`);
        }

        switch (_key) {

            // Logical Operators
            case '$and':
                const andArray = _searchObject[_key].map(_conditional => _evaluationForKey(Object.keys(_conditional)[0], _conditional, null, _parentObject));
                // test if every conditional is true
                return _testRecord => andArray.every(test => test(_testRecord));
            case '$not':
                return _testRecord => {
                    const _condition = _evaluationForKey(Object.keys(_searchObject[_key])[0], _searchObject[_key], _parentKeys, _parentObject);
                    return !_condition(_testRecord);
                }
            case '$nor':
                const norArray = _searchObject[_key].map(_conditional => _evaluationForKey(Object.keys(_conditional)[0], _conditional, null, _parentObject));
                // test if every conditional is false
                return _testRecord => norArray.every(test => !test(_testRecord));
            case '$or':
                const orArray = _searchObject[_key].map(_conditional => _evaluationForKey(Object.keys(_conditional)[0], _conditional, null, _parentObject));
                // test if at least one conditional is true
                return _testRecord => orArray.some(test => test(_testRecord));

            // Comparison Operators
            case '$eq':
                return _testRecord => {
                    // TODO: update to accomodate regular expressions
                    const [_searchValue, _testedValue] = _getValues(_searchObject, _testRecord, _key, _parentKeys);
                    return _testedValue == _searchValue;
                };
            case '$gt':
                return _testRecord => {
                    const [_searchValue, _testedValue] = _getValues(_searchObject, _testRecord, _key, _parentKeys);
                    return _testedValue > _searchValue;
                };
            case '$gte':
                return _testRecord => {
                    const [_searchValue, _testedValue] = _getValues(_searchObject, _testRecord, _key, _parentKeys);
                    return _testedValue >= _searchValue;
                };
            case '$in':
                return _testRecord => {
                    const [_searchValue, _testedValue] = _getValues(_searchObject, _testRecord, _key, _parentKeys);
                    return _searchValue.indexOf(_testedValue) > -1;
                };
            case '$lt':
                return _testRecord => {
                    const [_searchValue, _testedValue] = _getValues(_searchObject, _testRecord, _key, _parentKeys);
                    return _testedValue < _searchValue;
                };
            case '$lte':
                return _testRecord => {
                    const [_searchValue, _testedValue] = _getValues(_searchObject, _testRecord, _key, _parentKeys);
                    return _testedValue <= _searchValue;
                };
            case '$ne':
                return _testRecord => {
                    const [_searchValue, _testedValue] = _getValues(_searchObject, _testRecord, _key, _parentKeys);
                    return _testedValue != _searchValue;
                };
            case '$nin':
                return _testRecord => {
                    const [_searchValue, _testedValue] = _getValues(_searchObject, _testRecord, _key, _parentKeys);
                    return _searchValue.indexOf(_testedValue) == -1;
                };

            //Element Query Operators
            case '$exists':
                return _testRecord => {
                    const [_searchValue, _testedValue] = _getValues(_searchObject, _testRecord, _key, _parentKeys).map(value => convertToBool(value));
                    let _searchingForExist = _searchValue === _testedValue;                    
                    try {
                        // TODO: account for dot notation
                        //_parentKeys[_parentKeys.length - 1].split('.').forEach(subkey => _testRecord = _testRecord[subkey]);
                        return _searchingForExist ? true : false;
                    } catch (_error) {
                        return _searchingForExist ? false : true;
                    }
                }
            case '$type':
                return _testRecord => {
                    const [_searchValue, _testedValue] = _getValues(_searchObject, _testRecord, _key, _parentKeys);
                    //TODO: accomodate array of searched types
                    // https://www.mongodb.com/docs/manual/reference/operator/query/type/
                    return typeof _testedValue === _searchValue;
                }

            // Evaluation Query Operators
            case '$expr':
                return _testRecord => {
                    const [_searchValue, _testedValue] = _getValues(_searchObject, _testRecord, _key, _parentKeys);
                    const _expressionOperator = Object.keys(_searchValue)[0];
                    const _expressionKeys = _searchValue[_expressionOperator];
                    // get values for keys....
                    const _getValuesFromExpressionKeys = (testRecord, key) => {
                        if (key[0] == '$') {
                            // get value for key... and of course, account for dot notation
                            key.replace('$', '').split('.').forEach(subKey => {
                                testRecord = testRecord[subKey];
                            });
                            return testRecord;
                        } else {
                            return testRecord[key];
                        }
                    };
                    const valuesFromKeys = _expressionKeys.map(key => _getValuesFromExpressionKeys({ ..._testRecord }, key));
                    switch (_expressionOperator) {
                        case '$eq':
                            return valuesFromKeys[0] == valuesFromKeys[1];
                        case '$gt':
                            return valuesFromKeys[0] > valuesFromKeys[1];
                        case '$gte':
                            return valuesFromKeys[0] >= valuesFromKeys[1];
                        case '$lt':
                            return valuesFromKeys[0] < valuesFromKeys[1];
                        case '$lte':
                            return valuesFromKeys[0] <= valuesFromKeys[1];
                    }
                }
            case '$jsonSchema':
                _throwNotImplemented();
            case '$mod':
                return _testRecord => {
                    const [_searchValue, _testedValue] = _getValues(_searchObject, _testRecord, _key, _parentKeys);
                    if (Array.isArray(_searchValue)) {
                        const _parentKey = _parentKeys[_parentKeys.length - 1];
                        let _testValue = _testRecord;
                        _parentKey.split('.').forEach(subKey => {
                            _testValue = _testValue[subKey];
                        });
                        return _testValue % _searchValue[0] == _searchValue[1];
                    } else {
                        return false;
                    }
                }
            case '$regex':
                return _testRecord => {
                    const [_searchValue, _testedValue] = _getValues(_searchObject, _testRecord, _key, _parentKeys);
                    return _searchValue.test(_testedValue);
                }
            case '$text':
                return _testRecord => {
                    // requires special handling as searching across multiple indices may be needed....
                    throw new Error('Mongrowser Collection.find: "$text" search requires special handling');
                }
            case '$where':
                return _testRecord => {                    
                    switch(typeof _searchObject.$where){
                        case "string":                            
                            throw new Error('Mongrowser Collection.find: "$where" search by evaluation string not supported; pass a function instead.');
                        case "function":                            
                            return _searchObject.$where(_testRecord);
                    }
                }

            // Geospatial Query Operators - not implemented
            case '$geoIntersects':
                _throwNotImplemented();
            case '$geoWithin':
                _throwNotImplemented();
            case '$near':
                _throwNotImplemented();
            case '$nearSphere':
                _throwNotImplemented();
            case '$box':
                _throwNotImplemented();
            case '$center':
                _throwNotImplemented();
            case '$centerSphere':
                _throwNotImplemented();
            case '$geometry':
                _throwNotImplemented();
            case '$maxDistance':
                _throwNotImplemented();
            case '$minDistance':
                _throwNotImplemented();
            case '$polygon':
                _throwNotImplemented();

            // Array Query Operators
            case '$all':
                break;
            case '$elemMatch':
                break;
            case '$size':
                break;

            // Bitwise Query Operators - not implemented
            case '$bitsAllClear':
                _throwNotImplemented();
            case '$bitsAllSet':
                _throwNotImplemented();
            case '$bitsAnyClear':
                _throwNotImplemented();
            case '$bitsAnySet':
                _throwNotImplemented();

            // Projection Operators - not implemented
            case '$':
                _throwNotImplemented();
            case '$elemMatch':
                _throwNotImplemented();
            case '$meta':
                _throwNotImplemented();
            case '$slice':
                _throwNotImplemented();

            // Miscellaneous Query Operators - not implemented
            case '$comment':
                _throwNotImplemented();
            case '$rand':
                _throwNotImplemented();
            case '$natural':
                _throwNotImplemented();

            default:
                if (typeof _searchObject[_key] === 'object') {
                    // nested query objects have a single special operator key
                    _parentKeys.push(_key);
                    return _evaluationForKey(Object.keys(_searchObject[_key])[0], _searchObject, _parentKeys, _parentObject);
                } else {
                    if (_key.includes('.')) {
                        // account for dot notation                
                        return testedRecord => {
                            let _testedRecord = testedRecord;
                            _key.split('.').forEach(subKey => _testedRecord = _testedRecord[subKey]);
                            return _testedRecord == _searchObject[_key];
                        };
                    } else {
                        return testedRecord => {
                            if (_parentKeys.length === 0) return testedRecord[_key] == _searchObject[_key];
                            // we need to accomodate recursion;
                            let testedValue = testedRecord;
                            let searchedValue = _searchObject;
                            _parentKeys.forEach(_parentKey => {
                                testedValue = testedValue[_parentKey];
                                searchedValue = searchedValue[_parentKey];
                            });
                            return searchedValue == testedValue;
                        };
                    }
                }
        }
    }
    Object.keys(searchObject).forEach(key => {
        testArray.push(_evaluationForKey(key, searchObject));
    });
    // a searchObject with no keys returns all records
    if (Object.keys(searchObject).length == 0) testArray.push((testRecord) => true);
    return testArray;
};