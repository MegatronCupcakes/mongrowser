import Mongrowser from "mongrowser";
import { getSeeds } from "seed";
import _ from "underscore";
import "mocha";

const assert = chai.assert;

describe('Comparison Operators', function(){

    this.timeout(30 * 1000);

    const databaseName = 'mongrowser_test_database';
    let database;
    let seeds = getSeeds();

    before(async function(){
        database = new Mongrowser(databaseName);
        await database.import(seeds);
    });

    it('$eq', () => {
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
                            collectionRecords: await collection.find({name: {$eq: seededRecord.name}})
                        });
                    }
                }
                assert(_.every(testData, test => {                    
                    test.collectionRecords.forEach((record, _i) => delete test.collectionRecords[_i].createdAt);
                    return _.every(test.collectionRecords, collectionRecord => _.isEqual(test.seed, collectionRecord));
                }), 'returned collection records should match seeded record');
                resolve();
            } catch(error){
                reject(error);
            }
        });        
    });

    it('$gt', () => {
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
                            collectionRecords: await collection.find({number: {$gt: seededRecord.number}})
                        });
                    }
                }
                assert(_.every(testData, test => {                    
                    test.collectionRecords.forEach((record, _i) => delete test.collectionRecords[_i].createdAt);
                    return _.every(test.collectionRecords, collectionRecord => test.seed.number < collectionRecord.number);
                }), 'returned collection record numbers should be greater than seeded record number');
                resolve();
            } catch(error){
                reject(error);
            }
        });        
    });

    it('$gte', () => {
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
                            collectionRecords: await collection.find({number: {$gte: seededRecord.number}})
                        });
                    }
                }
                assert(_.every(testData, test => {                    
                    test.collectionRecords.forEach((record, _i) => delete test.collectionRecords[_i].createdAt);
                    return _.every(test.collectionRecords, collectionRecord => test.seed.number <= collectionRecord.number);
                }), 'returned collection record numbers should be greater than or equal to seeded record number');
                resolve();
            } catch(error){
                reject(error);
            }
        });        
    });

    it('$in', () => {
        return new Promise(async (resolve, reject) => {
            try {
                const testNumbers = [1, 67, 19, 83];
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
                            collectionRecords: await collection.find({number: {$in: testNumbers}})
                        });
                    }
                }
                assert(_.every(testData, test => {                    
                    test.collectionRecords.forEach((record, _i) => delete test.collectionRecords[_i].createdAt);
                    return _.every(test.collectionRecords, collectionRecord => _.contains(testNumbers, collectionRecord.number));
                }), 'returned collection record numbers should be one of the test numbers');
                resolve();
            } catch(error){
                reject(error);
            }
        });        
    });

    it('$lt', () => {
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
                            collectionRecords: await collection.find({number: {$lt: seededRecord.number}})
                        });
                    }
                }
                assert(_.every(testData, test => {                    
                    test.collectionRecords.forEach((record, _i) => delete test.collectionRecords[_i].createdAt);
                    return _.every(test.collectionRecords, collectionRecord => test.seed.number > collectionRecord.number);
                }), 'returned collection record numbers should be less than seeded record number');
                resolve();
            } catch(error){
                reject(error);
            }
        });        
    });

    it('$lte', () => {
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
                            collectionRecords: await collection.find({number: {$lte: seededRecord.number}})
                        });
                    }
                }
                assert(_.every(testData, test => {                    
                    test.collectionRecords.forEach((record, _i) => delete test.collectionRecords[_i].createdAt);
                    return _.every(test.collectionRecords, collectionRecord => test.seed.number >= collectionRecord.number);
                }), 'returned collection record numbers should be less than seeded record number');
                resolve();
            } catch(error){
                reject(error);
            }
        });        
    });

    it('$ne', () => {
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
                            collectionRecords: await collection.find({number: {$ne: seededRecord.number}})
                        });
                    }
                }
                assert(_.every(testData, test => {                    
                    test.collectionRecords.forEach((record, _i) => delete test.collectionRecords[_i].createdAt);
                    return _.every(test.collectionRecords, collectionRecord => test.seed.number != collectionRecord.number);
                }), 'returned collection record numbers should not equal seeded record number');
                resolve();
            } catch(error){
                reject(error);
            }
        });        
    });

    it('$nin', () => {
        return new Promise(async (resolve, reject) => {
            try {
                const testNumbers = [1, 67, 19, 83];
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
                            collectionRecords: await collection.find({number: {$nin: testNumbers}})
                        });
                    }
                }
                assert(_.every(testData, test => {                    
                    test.collectionRecords.forEach((record, _i) => delete test.collectionRecords[_i].createdAt);
                    return _.every(test.collectionRecords, collectionRecord => !_.contains(testNumbers, collectionRecord.number));
                }), 'returned collection record numbers should not be one of the test numbers');
                resolve();
            } catch(error){
                reject(error);
            }
        });        
    });

});