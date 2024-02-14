import Mongrowser from "mongrowser";
import { getSeeds } from "../util/seed.js";
import _ from "underscore";
import "mocha";

const assert = chai.assert;

describe('Array Query Operators', function(){

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
    
    it('$all', () => {
        return new Promise(async (resolve, reject) => {
            try {
                const queryArray = [
                    "testRecord 87",
                    "testRecord 88"
                ];
                const expectedNames = [
                    "testRecord 85",
                    "testRecord 86",
                    "testRecord 89",
                    "testRecord 90",
                ];
                const testData = [];        
                const collectionNames = Object.keys(seeds);
                for(let i = 0; i < collectionNames.length; i++){
                    const collectionName = collectionNames[i];
                    const collection = await database.getCollection(collectionName);
                    const seededRecords = seeds[collectionName];
                    for(let _i = 0; _i < seededRecords.length; _i++){
                        const seededRecord = seededRecords[_i];
                        testData.push({
                            seed: seededRecord,
                            collectionRecords: await collection.find({range: {$all: queryArray}})
                        });
                    }
                }
                assert(_.every(testData, test => {                    
                    return test.collectionRecords.length == expectedNames.length;
                }), `test should return ${expectedNames.length} records`);
                assert(_.every(testData, test => {                    
                    return _.every(test.collectionRecords, testRecord => _.contains(expectedNames, testRecord.name));
                }), 'test records do not match expected record names');
                resolve();
            } catch(error){
                reject(error);
            }
        });        
    });
    
    it('$elemMatch', () => {
        return new Promise(async (resolve, reject) => {
            try {
                const elemMatchQuery = {numberRange: {$elemMatch: {$gte: 85, $lte: 90}}};
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
                const testData = [];        
                const collectionNames = Object.keys(seeds);
                for(let i = 0; i < collectionNames.length; i++){
                    const collectionName = collectionNames[i];
                    const collection = await database.getCollection(collectionName);
                    const _results = await collection.find(elemMatchQuery);
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
                resolve();
            } catch(error){
                reject(error);
            }
        });        
    });

    it('$size', () => {
        return new Promise(async (resolve, reject) => {
            try {
                const testSizes = [3, 4, 5, 6];
                const sizeMap = {
                    3: [
                        "testRecord 1",
                        "testRecord 100"
                    ],
                    4: [
                        "testRecord 2",
                        "testRecord 99"
                    ],
                    5: [
                        "testRecord 3",
                        "testRecord 98"
                    ]
                };
                const testData = [];        
                const collectionNames = Object.keys(seeds);
                for(let i = 0; i < collectionNames.length; i++){
                    const collectionName = collectionNames[i];
                    const collection = await database.getCollection(collectionName);

                    for(let _i = 0; _i < testSizes.length; _i++){
                        const testSize = testSizes[_i];
                        const _results = await collection.find({range: {$size: testSize}})
                        testData.push({
                            testSize: testSize,
                            count: _results.length,
                            collectionRecords: _results,
                            expectedCollectionRecords: _.keys(sizeMap).includes(testSize.toString()) ? await collection.find({name: {$in: sizeMap[testSize]}}) : [],
                            seedCount: seeds[collectionName].length
                        });
                    }                    
                }
                
                let expectedCount, expectedCollectionRecords, collectionCount, testSize, collectionRecords, collectionRecord;
                assert(_.every(testData, test => {
                    collectionCount = test.count;
                    testSize = test.testSize;
                    collectionRecords = test.collectionRecords;
                    expectedCollectionRecords = test.expectedCollectionRecords;
                    if(_.keys(sizeMap).includes(test.testSize.toString())){
                        expectedCount = sizeMap[test.testSize].length;                        
                        return collectionCount == expectedCount;
                    } else {
                        const nonSixTotal = _.keys(sizeMap).reduce((sum, key) => sizeMap[key].length + sum, 0);
                        expectedCount = test.seedCount - nonSixTotal;
                        return expectedCount == test.count;
                    }                                        
                }), `test should return ${expectedCount} records (query returned ${collectionCount}) for test size: ${testSize}\n\ncollectionRecords:\n${JSON.stringify(collectionRecords, null, 4)}\n\nexpected records:\n${JSON.stringify(expectedCollectionRecords, null, 4)}`);
                assert(_.every(testData, test => {
                    collectionCount = test.count;
                    testSize = test.testSize;
                    collectionRecords = test.collectionRecords;
                    expectedCollectionRecords = test.expectedCollectionRecords;
                    return _.every(test.collectionRecords, testRecord => {
                        collectionRecord = testRecord;
                        if(_.keys(sizeMap).includes(test.testSize.toString())){
                            return _.contains(sizeMap[test.testSize], testRecord.name);
                        }
                        return !_.contains(sizeMap[test.testSize], testRecord.name);
                    });
                }), `test records do not match expected record names; for $size: ${testSize}, "${collectionRecord.name}" should${_.keys(sizeMap).includes(testSize) ? " " : " not "}be in ${JSON.stringify(sizeMap[testSize])}\ncollectionRecords:\n${JSON.stringify(collectionRecords, null, 4)}\nexpected records:\n${JSON.stringify(expectedCollectionRecords, null, 4)}`);
                resolve();
            } catch(error){
                reject(error);
            }
        });        
    });

});