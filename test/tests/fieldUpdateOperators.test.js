import Mongrowser from "mongrowser";
import { getSeeds } from "../util/seed.js";
import _ from "underscore";
import "mocha";

const assert = chai.assert;

describe('Field Update Operators', function(){

    this.timeout(5 * 60 * 1000);

    const databaseName = 'mongrowser_test_database';
    const indices = [
        'name',
        {name: "text"}
    ];
    let database;
    const seeds = getSeeds();
    
    beforeEach(function(){
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
    
    it('$currentDate', () => {
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
                        let validationRecord = {
                            seededRecord: seededRecord,
                        };
                        validationRecord.boolUpdate = await collection.update({_id: seededRecord._id},{$set: {testDate: {$currentDate: true}}});
                        validationRecord.boolUpdated = await collection.findOne({_id: seededRecord._id});
                        validationRecord.timestampUpdate = await collection.update({_id: seededRecord._id},{$set: {testDate: {$currentDate: {$type: "timestamp"}}}});
                        validationRecord.timestampUpdated = await collection.findOne({_id: seededRecord._id});
                        validationRecord.dateUpdate = await collection.update({_id: seededRecord._id},{$set: {testDate: {$currentDate: {$type: "date"}}}});
                        validationRecord.dateUpdated = await collection.findOne({_id: seededRecord._id});
                        testData.push(validationRecord);
                    }
                }
                let testedRecord;
                assert(testData.every(validationRecord => {
                    testedRecord = validationRecord;
                    return validationRecord.boolUpdate && _.isDate(validationRecord.boolUpdated.testDate);
                }), `boolean update: test date (${JSON.stringify(testedRecord.boolUpdated.testDate)}) should be a date`);
                assert(testData.every(validationRecord => {
                    testedRecord = validationRecord;
                    return validationRecord.timestampUpdate && _.isNumber(validationRecord.timestampUpdated.testDate);
                }), `timestamp update: test date (${JSON.stringify(testedRecord.timestampUpdated.testDate)}) should be a timestamp`);
                assert(testData.every(validationRecord => {
                    testedRecord = validationRecord;
                    return validationRecord.dateUpdate && _.isDate(validationRecord.dateUpdated.testDate);
                }), `date update: test date (${JSON.stringify(testedRecord.dateUpdated.testDate)}) should be a date`);
                resolve();
            } catch(error){
                console.log(`ERROR: ${error.message}`);
                reject(error);
            }
        });        
    });

    it('$inc', () => {
        return new Promise(async (resolve, reject) => {
            try {
                const increment = 3;
                const testData = [];        
                const collectionNames = Object.keys(seeds);
                for(let i = 0; i < collectionNames.length; i++){
                    const collectionName = collectionNames[i];
                    const collection = await database.getCollection(collectionName);
                    const seededRecords = seeds[collectionName];
                    for(let _i = 0; _i < seededRecords.length; _i++){                        
                        const seededRecord = seededRecords[_i];
                        let validationRecord = {
                            seededRecord: seededRecord,
                        };
                        validationRecord.isUpdated = await collection.update({_id: seededRecord._id},{$set: {number: {$inc: increment}}});
                        validationRecord.updatedRecord = await collection.findOne({_id: seededRecord._id});
                        testData.push(validationRecord);
                    }
                }
                let testedRecord;
                assert(testData.every(validationRecord => {
                    testedRecord = validationRecord;
                    return validationRecord.isUpdated && validationRecord.seededRecord.number + increment == validationRecord.updatedRecord.number;
                }), `test record number (${JSON.stringify(testedRecord.updatedRecord.number)}) should equal ${testedRecord.seededRecord.number + increment} (${testedRecord.seededRecord.number} + ${increment})\n\n${JSON.stringify(testedRecord.updatedRecord, null, 4)}`);
                resolve();
            } catch(error){
                reject(error);
            }
        });        
    });
    
    it('$min', () => {
        return new Promise(async (resolve, reject) => {
            try {
                const min = 50;
                const testData = [];        
                const collectionNames = Object.keys(seeds);
                for(let i = 0; i < collectionNames.length; i++){
                    const collectionName = collectionNames[i];
                    const collection = await database.getCollection(collectionName);
                    const seededRecords = seeds[collectionName];
                    for(let _i = 0; _i < seededRecords.length; _i++){                        
                        const seededRecord = seededRecords[_i];
                        let validationRecord = {
                            seededRecord: seededRecord
                        };
                        validationRecord.isUpdated = await collection.update({_id: seededRecord._id},{$set: {number: {$min: min}}});
                        validationRecord.updatedRecord = await collection.findOne({_id: seededRecord._id});
                        testData.push(validationRecord);
                    }
                }
                let testedRecord;
                assert(testData.every(validationRecord => {
                    testedRecord = validationRecord;
                    return validationRecord.isUpdated && validationRecord.updatedRecord.number >= min;
                }), `test record number (${JSON.stringify(testedRecord.updatedRecord.number)}) should be at least the specified minimum (${min}; update succeded: ${testedRecord.isUpdated})\n\n${JSON.stringify(testedRecord.updatedRecord, null, 4)}`);                
                resolve();
            } catch(error){                
                reject(error);
            }
        });        
    });

    it('$max', () => {
        return new Promise(async (resolve, reject) => {
            try {
                const max = 50;
                const testData = [];        
                const collectionNames = Object.keys(seeds);
                for(let i = 0; i < collectionNames.length; i++){
                    const collectionName = collectionNames[i];
                    const collection = await database.getCollection(collectionName);
                    const seededRecords = seeds[collectionName];
                    for(let _i = 0; _i < seededRecords.length; _i++){                        
                        const seededRecord = seededRecords[_i];
                        let validationRecord = {
                            seededRecord: seededRecord
                        };
                        validationRecord.isUpdated = await collection.update({_id: seededRecord._id},{$set: {number: {$max: max}}});
                        validationRecord.updatedRecord = await collection.findOne({_id: seededRecord._id});
                        testData.push(validationRecord);
                    }
                }
                let testedRecord;
                assert(testData.every(validationRecord => {
                    testedRecord = validationRecord;
                    return validationRecord.isUpdated && validationRecord.updatedRecord.number <= max;
                }), `test record number (${JSON.stringify(testedRecord.updatedRecord.number)}) should be greater than or equal to the specified maximum (${max}; update succeded: ${testedRecord.isUpdated})\n\n${JSON.stringify(testedRecord.updatedRecord, null, 4)}`);                
                resolve();
            } catch(error){
                reject(error);
            }
        });        
    });
    
    it('$mul', () => {
        return new Promise(async (resolve, reject) => {
            try {
                const multiplier = 2;
                const testData = [];        
                const collectionNames = Object.keys(seeds);
                for(let i = 0; i < collectionNames.length; i++){
                    const collectionName = collectionNames[i];
                    const collection = await database.getCollection(collectionName);
                    const seededRecords = seeds[collectionName];
                    for(let _i = 0; _i < seededRecords.length; _i++){                        
                        const seededRecord = seededRecords[_i];
                        let validationRecord = {
                            seededRecord: seededRecord
                        };
                        validationRecord.isUpdated = await collection.update({_id: seededRecord._id},{$mul: {number: multiplier, number2: multiplier}});
                        validationRecord.updatedRecord = await collection.findOne({_id: seededRecord._id});
                        testData.push(validationRecord);
                    }
                }
                let testedRecord;
                assert(testData.every(validationRecord => {
                    testedRecord = validationRecord;
                    return validationRecord.isUpdated && validationRecord.updatedRecord.number == validationRecord.seededRecord.number * multiplier;
                }), `test record number (${JSON.stringify(testedRecord.updatedRecord.number)}) should be equal to ${testedRecord.seededRecord.number * multiplier} (${testedRecord.seededRecord.number} * ${multiplier}; update succeded: ${testedRecord.isUpdated})\n\n${JSON.stringify(testedRecord.updatedRecord, null, 4)}`);
                assert(testData.every(validationRecord => {
                    testedRecord = validationRecord;
                    return validationRecord.isUpdated && validationRecord.updatedRecord.number2 == validationRecord.seededRecord.number2 * multiplier;
                }), `test record number2 (${JSON.stringify(testedRecord.updatedRecord.number2)}) should be equal to ${testedRecord.seededRecord.number2 * multiplier} (${testedRecord.seededRecord.number} * ${multiplier}; update succeded: ${testedRecord.isUpdated})\n\n${JSON.stringify(testedRecord.updatedRecord, null, 4)}`);
                resolve();
            } catch(error){
                reject(error);
            }
        });        
    });
    
    it('$rename', () => {
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
                        let validationRecord = {
                            seededRecord: seededRecord
                        };
                        validationRecord.isUpdated = await collection.update({_id: seededRecord._id},{$rename: {name: "name_renamed"}});
                        validationRecord.updatedRecord = await collection.findOne({_id: seededRecord._id});
                        testData.push(validationRecord);
                    }
                }
                let testedRecord;
                assert(testData.every(validationRecord => {
                    testedRecord = validationRecord;
                    return validationRecord.isUpdated && Object.hasOwn(validationRecord.updatedRecord, "name_renamed");
                }), `test record should have property "name_renamed"; update succeded: ${testedRecord.isUpdated})\n\n${JSON.stringify(testedRecord.updatedRecord, null, 4)}`);
                assert(testData.every(validationRecord => {
                    testedRecord = validationRecord;
                    return validationRecord.isUpdated && !Object.hasOwn(validationRecord.updatedRecord, "name");
                }), `test record should not have property "name"; update succeded: ${testedRecord.isUpdated})\n\n${JSON.stringify(testedRecord.updatedRecord, null, 4)}`);
                assert(testData.every(validationRecord => {
                    testedRecord = validationRecord;
                    return validationRecord.isUpdated && validationRecord.updatedRecord.name_renamed == validationRecord.seededRecord.name;
                }), `test record name_renamed ("${JSON.stringify(testedRecord.updatedRecord.name_renamed)}") should be equal to "${testedRecord.seededRecord.name}"; update succeded: ${testedRecord.isUpdated})\n\n${JSON.stringify(testedRecord.updatedRecord, null, 4)}`);                
                resolve();
            } catch(error){
                reject(error);
            }
        });        
    });
        
    it('$set', () => {
        return new Promise(async (resolve, reject) => {
            try {
                const suffix = '_renamed';
                const testData = [];        
                const collectionNames = Object.keys(seeds);
                for(let i = 0; i < collectionNames.length; i++){
                    const collectionName = collectionNames[i];
                    const collection = await database.getCollection(collectionName);
                    const seededRecords = seeds[collectionName];
                    for(let _i = 0; _i < seededRecords.length; _i++){                        
                        const seededRecord = seededRecords[_i];
                        let validationRecord = {
                            seededRecord: seededRecord
                        };
                        validationRecord.isUpdated = await collection.update({_id: seededRecord._id},{$set: {name: `${seededRecord.name}${suffix}`}});
                        validationRecord.updatedRecord = await collection.findOne({_id: seededRecord._id});
                        testData.push(validationRecord);
                    }
                }
                let testedRecord;
                assert(testData.every(validationRecord => {
                    testedRecord = validationRecord;
                    return validationRecord.isUpdated && validationRecord.updatedRecord.name == `${validationRecord.seededRecord.name}${suffix}`;
                }), `test record name ("${JSON.stringify(testedRecord.updatedRecord.name)}") should be equal to "${testedRecord.seededRecord.name}${suffix}"; update succeded: ${testedRecord.isUpdated})\n\n${JSON.stringify(testedRecord.updatedRecord, null, 4)}`);                
                resolve();
            } catch(error){
                reject(error);
            }
        });        
    });
            
    it('$setOnInsert', () => {
        return new Promise(async (resolve, reject) => {
            try {
                const testData = [];
                const suffix = '_inserted';
                const collectionNames = Object.keys(seeds);
                for(let i = 0; i < collectionNames.length; i++){
                    const collectionName = collectionNames[i];
                    const collection = await database.getCollection(collectionName);
                    const seededRecords = seeds[collectionName];
                    for(let _i = 0; _i < seededRecords.length; _i++){                                                
                        const seededRecord = seededRecords[_i];
                        let validationRecord = {
                            seededRecord: seededRecord
                        };
                        let updateRecord = {...seededRecord};
                        delete updateRecord._id;
                        validationRecord.isUpdated = await collection.update({name: seededRecord.name},{$setOnInsert: {...updateRecord, name: `${updateRecord.name}${suffix}`}});
                        validationRecord.isInserted = await collection.update({name: `${seededRecord.name}${suffix}`},{$setOnInsert: {...updateRecord, name: `${updateRecord.name}${suffix}`}});
                        validationRecord.updatedRecord = await collection.findOne({name: seededRecord.name});
                        validationRecord.insertedRecord = await collection.findOne({name: `${seededRecord.name}${suffix}`});
                        testData.push(validationRecord);
                    }
                }
                let testedRecord;                
                assert(testData.every(validationRecord => {
                    testedRecord = validationRecord;
                    return validationRecord.isUpdated && validationRecord.updatedRecord.name != `${validationRecord.seededRecord.name}${suffix}`;
                }), `the updated test record name ("${JSON.stringify(testedRecord.updatedRecord.name)}") should NOT be equal to "${testedRecord.seededRecord.name}${suffix}"; update succeded: ${testedRecord.isUpdated})\n\n${JSON.stringify(testedRecord.updatedRecord, null, 4)}`);                
                assert(testData.every(validationRecord => {
                    testedRecord = validationRecord;
                    return validationRecord.isInserted && validationRecord.insertedRecord.name == `${validationRecord.seededRecord.name}${suffix}`;
                }), `the inserted test record name ("${JSON.stringify(testedRecord.insertedRecord.name)}") should be equal to "${testedRecord.seededRecord.name}${suffix}"; insert succeded: ${testedRecord.isInserted})\n\n${JSON.stringify(testedRecord.insertedRecord, null, 4)}`);                
                
                resolve();
            } catch(error){
                reject(error);
            }
        });        
    });
    
    it('$unset', () => {
        return new Promise(async (resolve, reject) => {
            try {
                const testData = [];
                const unsetField = 'number2';
                const collectionNames = Object.keys(seeds);
                for(let i = 0; i < collectionNames.length; i++){
                    const collectionName = collectionNames[i];
                    const collection = await database.getCollection(collectionName);
                    const seededRecords = seeds[collectionName];
                    for(let _i = 0; _i < seededRecords.length; _i++){                                                
                        const seededRecord = seededRecords[_i];
                        let validationRecord = {
                            seededRecord: seededRecord
                        };
                        let updateRecord = {...seededRecord};
                        delete updateRecord._id;
                        validationRecord.isUpdated = await collection.update({name: seededRecord.name},{$unset: {[unsetField]: ""}});
                        validationRecord.updatedRecord = await collection.findOne({name: seededRecord.name});
                        testData.push(validationRecord);
                    }
                }
                let testedRecord;                
                assert(testData.every(validationRecord => {
                    testedRecord = validationRecord;
                    return validationRecord.isUpdated && Object.hasOwn(validationRecord.seededRecord, unsetField) && !Object.hasOwn(validationRecord.updatedRecord, unsetField);
                }), `the seeded record should have key "${unsetField}" and the updated record should not`);                
                resolve();
            } catch(error){
                reject(error);
            }
        });        
    });
    
});