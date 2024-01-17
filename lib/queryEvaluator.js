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
                    const [_searchValue, _testedValue] = _getValues(_searchObject, _testRecord, _key, _parentKeys);
                    const _searchingForExist = _searchValue === true || (typeof _searchValue === 'string' && _searchValue.toLowerCase() === 'true') || (_isNumeric(_searchValue) && Number(_searchValue) === 1) ? true : false;
                    // account for dot notation
                    try {
                        _parentKeys[_parentKeys.length - 1].split('.').forEach(subkey => _testRecord = _testRecord[subkey]);
                        return _searchingForExist ? true : false;
                    } catch (_error) {
                        return _searchingForExist ? false : true;
                    }
                }
                break;
            case '$type':
                return _testRecord => {
                    const [_searchValue, _testedValue] = _getValues(_searchObject, _testRecord, _key, _parentKeys);                    
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
                            return key;
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
                // Not Implemented (yet)
                break;
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
                //console.log(`_testRecord: ${JSON.stringify(_testRecord)} searchObject: ${JSON.stringify(searchObject)} _key: ${_key}, _parentKeys: ${JSON.stringify(_parentKeys)} _searchValue: ${JSON.stringify(_searchValue)} _testedValue: ${JSON.stringify(_testedValue)}`);
                //const [_searchValue, _testedValue] = _getValues(_searchObject, _testRecord, _key, _parentKeys);
                //const _parentKey = _parentKeys[_parentKeys.length - 1];
                //Object.keys(_searchValue)
                break;
            case '$text':
                break;
            case '$where':
                break;
            // Geospatial Query Operators - not implemented
            // Array Query Operators
            case '$all':
                break;
            case '$elemMatch':
                break;
            case '$size':
                break;
            // Bitwise Query Operators - not implemented
            // Projection Operators - not implemented
            // Miscellaneous Query Operators - not implemented
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