import Mongrowser from "mongrowser";
import { getSeeds } from "seed";
import _ from "underscore";
import "mocha";

const assert = chai.assert;

describe('Evaluation Query Operators', function(){

    this.timeout(5 * 60 * 1000);

    const databaseName = 'mongrowser_test_database';
    const indices = [
        'name',
        {name: "text"}
    ];
    let database;
    let seeds = getSeeds();
    
    before(function(){
        return new Promise(async (resolve, reject) => {
            try {
                database = new Mongrowser(databaseName);
                await database.import(seeds);
                for(let i = 0; i < database._collections.length; i++){
                    const collectionName = database._collections[i];
                    const collection = await database.getCollection(collectionName);
                    for(let _i = 0; _i < indices.length; _i++){
                        await collection.createIndex(indices[_i]);
                    }
                }
                resolve();
            } catch(error){
                reject(error);
            }
        });        
    });

    it('$expr', () => {
        return new Promise(async (resolve, reject) => {
            try {
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
                            gt: await collection.find({$expr: {$gt: ["number", "number2"]}}),
                            gte: await collection.find({$expr: {$gte: ["number", "number2"]}}),
                            eq: await collection.find({$expr: {$eq: ["number", "number2"]}}),
                            lt: await collection.find({$expr: {$lt: ["number", "number2"]}}),
                            lte: await collection.find({$expr: {$lte: ["number", "number2"]}})
                        });
                    }
                }
                assert(_.every(testData, test => {                    
                    return _.every(test.gt, collectionRecord => collectionRecord.number > collectionRecord.number2);
                }), 'collection record number and number2 "greater than" comparison failed');
                assert(_.every(testData, test => {                    
                    return _.every(test.gte, collectionRecord => collectionRecord.number >= collectionRecord.number2);
                }), 'collection record number and number2 "greater than or equal to" comparison failed');
                assert(_.every(testData, test => {                    
                    return _.every(test.eq, collectionRecord => collectionRecord.number == collectionRecord.number2);
                }), 'collection record number and number2 "equal to" comparison failed');                
                assert(_.every(testData, test => {                    
                    return _.every(test.lt, collectionRecord => collectionRecord.number < collectionRecord.number2);
                }), 'collection record number and number2 "less than" comparison failed');                
                assert(_.every(testData, test => {                    
                    return _.every(test.lte, collectionRecord => collectionRecord.number <= collectionRecord.number2);
                }), 'collection record number and number2 "less than or equal to" comparison failed');
                resolve();                    
            } catch(error){
                reject(error);
            }
        });        
    });
    
    // Not Implemented (yet)
    /*
    it('$jsonSchema', () => {
        return new Promise(async (resolve, reject) => {
            try {
                
                resolve();
            } catch(error){
                reject(error);
            }
        });        
    });
    */
    
    it('$mod', () => {
        return new Promise(async (resolve, reject) => {
            try {
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
                            collectionRecords: await collection.find({number: {$mod: [2, 0]}})
                        });
                    }
                }
                assert(_.every(testData, test => {                    
                    return _.every(test.collectionRecords, collectionRecord => collectionRecord.number % 2 == 0);
                }), 'collection record number divided by 2 should have a remainder of 0');
                resolve();  
            } catch(error){
                reject(error);
            }
        });        
    });

    it('$regex', () => {
        return new Promise(async (resolve, reject) => {
            try {
                const pattern = new RegExp("^testRecord 9");
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
                            collectionRecords: await collection.find({name: {$regex: pattern}})
                        });
                    }
                }
                assert(_.every(testData, test => {                    
                    return _.every(test.collectionRecords, collectionRecord => pattern.test(collectionRecord.name));
                }), 'collection record name does not match the tested pattern');
                assert(_.every(testData, test => test.collectionRecords.length == 11), 'incorrect number of collection records returned for test pattern');
                resolve();  
            } catch(error){
                reject(error);
            }
        });        
    });
    
    it('$text', () => {
        return new Promise(async (resolve, reject) => {
            try {
                const searchTerm = "testRecord 9";
                const testData = [];        
                const collectionNames = Object.keys(seeds);
                for(let i = 0; i < collectionNames.length; i++){
                    const collectionName = collectionNames[i];
                    const collection = await database.getCollection(collectionName);
                    const testSet = {
                        collectionRecords: await collection.find({$text: {$search: searchTerm}}),
                        collectionRecordCount: null
                    };
                    testSet.collectionRecordCount = testSet.collectionRecords.length;
                    testData.push(testSet);
                        
                }                
                assert(_.every(testData, test => test.collectionRecords.length == 11), 'incorrect number of collection records returned');
                resolve();
            } catch(error){
                reject(error);
            }
        });        
    });
    
    it('$where', () => {
        return new Promise(async (resolve, reject) => {
            try {
                const whereString = 'testRecord.name.includes("testRecord 9")';
                const whereFunction = testRecord => testRecord.name.includes("testRecord 9");
                const testData = [];        
                const collectionNames = Object.keys(seeds);
                for(let i = 0; i < collectionNames.length; i++){
                    const collectionName = collectionNames[i];
                    const collection = await database.getCollection(collectionName);
                    let expressionError = null;
                    await collection.find({$where: whereString}).catch(error => {expressionError = error});
                    const testSet = {
                        expressionError: expressionError,
                        functionRecords: await collection.find({$where: whereFunction})
                    };
                    testData.push(testSet);
                        
                }
                assert(_.every(testData, test => test.expressionError.message == 'Mongrowser Collection.find: "$where" search by evaluation string not supported; pass a function instead.'), 'searching with evaluation string should generate the expected error message');
                assert(_.every(testData, test => test.functionRecords.length == 11), 'incorrect number of collection records returned for function');
                resolve();
            } catch(error){
                reject(error);
            }
        });        
    });
    
});