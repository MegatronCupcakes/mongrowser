import Mongrowser from "mongrowser";
import { getSeeds } from "../util/seed.js";
import _ from "underscore";
import "mocha";

const assert = chai.assert;

describe('Projection Operators', function(){

    this.timeout(5 * 60 * 1000);

    const databaseName = 'mongrowser_test_database';
    let database;
    let seeds = getSeeds();
    
    before(function(){
        return new Promise(async (resolve, reject) => {
            try {
                database = new Mongrowser(databaseName);
                await database.import(seeds);                
                resolve();
            } catch(error){
                reject(error);
            }
        });        
    });

    it('field projection test (inclusion)', () => {
        return new Promise(async (resolve, reject) => {
            try {
                const query = {};
                const projection = {fields: {}};
                const expectedKeys = ["_id", "number", "numberRange"];
                expectedKeys.forEach(key => projection.fields[key] = 1);
                const testData = [];
                const collectionNames = Object.keys(seeds);
                for(let i = 0; i < collectionNames.length; i++){
                    const collectionName = collectionNames[i];
                    const collection = await database.getCollection(collectionName);
                    const _results = await collection.find(query, projection);
                    testData.push({
                        count: _results.length,
                        collectionRecords: _results                        
                    });
                }
                assert(_.every(testData, test => {                    
                    return _.every(test.collectionRecords, testRecord => _.keys(testRecord).length == expectedKeys.length);
                }), `test records should have ${expectedKeys.length} keys: ${JSON.stringify(expectedKeys)}`);                
                assert(_.every(testData, test => {                    
                    return _.every(test.collectionRecords, testRecord => _.union(_.keys(testRecord), expectedKeys).length == expectedKeys.length);
                }), `test record keys should match expected keys (${JSON.stringify(expectedKeys)})`);
                resolve();
            } catch(error){
                reject(error);
            }
        });        
    });

    it('field projection test (exclusion)', () => {
        return new Promise(async (resolve, reject) => {
            try {
                const elemMatchQuery = {};
                const projection = {fields: {}};
                const excludedKeys = ["numberRange", "range"];
                excludedKeys.forEach(key => projection.fields[key] = 0);
                const mandatoryKeys = ["_id"];
                const testData = [];        
                const collectionNames = Object.keys(seeds);
                for(let i = 0; i < collectionNames.length; i++){
                    const collectionName = collectionNames[i];
                    const collection = await database.getCollection(collectionName);
                    const _results = await collection.find(elemMatchQuery, projection);
                    testData.push({
                        count: _results.length,
                        collectionRecords: _results                        
                    });
                }
                assert(_.every(testData, test => {                    
                    return _.every(test.collectionRecords, testRecord => _.every(_.keys(testRecord), key => !_.contains(excludedKeys, key)));
                }), `test records should not have excluded keys: ${JSON.stringify(excludedKeys)}`);                
                assert(_.every(testData, test => {                    
                    return _.every(test.collectionRecords, testRecord => _.every(mandatoryKeys, key => Object.hasOwn(testRecord, key)));
                }), `test record must contain mandatory keys (${JSON.stringify(mandatoryKeys)})`);
                resolve();
            } catch(error){
                reject(error);
            }
        });        
    });
    
    it('$ (array element projection)', () => {
        return new Promise(async (resolve, reject) => {
            try {
                const elemMatchQuery = {numberRange: {$elemMatch: {$gte: 85, $lte: 90}}};
                const projection = {"numberRange.$": 1};
                const expectedNames = [
                    "testRecord 82",
                    "testRecord 83",
                    "testRecord 84",
                    "testRecord 85",
                    "testRecord 86",
                    "testRecord 87",
                    "testRecord 88",
                    "testRecord 89",
                    "testRecord 90",
                    "testRecord 91",
                    "testRecord 92",
                    "testRecord 93"
                ];
                const expectedNumbers = expectedNames.map(name => Number(name.split(" ")[1]));
                const testData = [];        
                const collectionNames = Object.keys(seeds);
                for(let i = 0; i < collectionNames.length; i++){
                    const collectionName = collectionNames[i];
                    const collection = await database.getCollection(collectionName);
                    const _results = await collection.find(elemMatchQuery, projection);
                    testData.push({
                        count: _results.length,
                        collectionRecords: _results                        
                    });
                }
                assert(_.every(testData, test => {                    
                    return test.collectionRecords.length == expectedNames.length;
                }), `test should return ${expectedNames.length} records`);
                assert(_.every(testData, test => {                    
                    return _.every(test.collectionRecords, testRecord => _.contains(expectedNames, testRecord.name));
                }), 'test records do not match expected record names');                
                assert(_.every(testData, test => {                    
                    return _.every(test.collectionRecords, testRecord => _.isNumber(testRecord.numberRange));
                }), 'projected value should be a number');
                assert(_.every(testData, test => {                    
                    return _.every(test.collectionRecords, testRecord => _.contains(expectedNumbers, testRecord.numberRange));
                }), 'test records do not match expected record numbers');
                resolve();
            } catch(error){
                reject(error);
            }
        });        
    });
        
    it('$elemMatch projection', () => {
        return new Promise(async (resolve, reject) => {
            try {
                const query = {};
                const projection = {numberRange: {$elemMatch: {$gte: 85, $lte: 90}}};
                const testData = [];        
                const collectionNames = Object.keys(seeds);
                for(let i = 0; i < collectionNames.length; i++){
                    const collectionName = collectionNames[i];
                    const collection = await database.getCollection(collectionName);
                    const _results = await collection.find(query, projection);
                    testData.push({
                        count: _results.length,
                        seedCount: seeds[collectionName].length,
                        collectionRecords: _results                        
                    });
                }
                assert(_.every(testData, test => {                    
                    return test.count == test.seedCount;
                }), `test returned incorrect number of records`);
                assert(_.every(testData, test => {                    
                    return _.every(test.collectionRecords, testRecord => (_.isNumber(testRecord.numberRange) && testRecord.numberRange >= 85 && testRecord.numberRange <= 90) || _.isNull(testRecord.numberRange));
                }), 'test records numberRange should be a number $gte 85 and $lte 90 OR should be null if no value meets those conditions');
                resolve();
            } catch(error){
                reject(error);
            }
        });         
    });

    it('$slice projection', () => {
        return new Promise(async (resolve, reject) => {
            try {
                const query = {};
                const projection = {numberRange: {$slice: 3}};
                const projection2 = {numberRange: {$slice: [3, 2]}}
                const testData = [];        
                const collectionNames = Object.keys(seeds);
                for(let i = 0; i < collectionNames.length; i++){
                    const collectionName = collectionNames[i];
                    const collection = await database.getCollection(collectionName);
                    const _results = await collection.find(query, projection);
                    const _results2 = await collection.find(query, projection2);
                    testData.push({
                        collection: collection,
                        count: _results.length,
                        seedCount: seeds[collectionName].length,
                        collectionRecords: _results,
                        collectionRecords2: _results2                       
                    });
                }
                assert(_.every(testData, test => {                    
                    return test.count == test.seedCount;
                }), `test returned incorrect number of records`);
                assert(_.every(testData, test => {                    
                    return _.every(test.collectionRecords, async testRecord => {
                        const record = await test.collection.findOne({_id: testRecord._id});                        
                        return testRecord.numberRange == [record.numberRange[2]];
                    });
                }), 'test records numberRange should only contain the 3rd number from the array');

                assert(_.every(testData, test => {                    
                    return _.every(test.collectionRecords2, async testRecord => {
                        const record = await test.collection.findOne({_id: testRecord._id}).catch(error => console.log(`ERROR: error getting record; ${error.message}`));
                        const recordNumberRange = [record.numberRange[2], record.numberRange[3]];
                        return testRecord.numberRange.every(number => _.contains(recordNumberRange, number)) && recordNumberRange.every(number => _.contains(testRecord.numberRange, number));
                    });
                }), 'test records numberRange should contain the 3rd and 4th number from the array');
                resolve();
            } catch(error){
                reject(error);
            }
        });        
    });
    
});