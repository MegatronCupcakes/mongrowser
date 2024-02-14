import Mongrowser from "mongrowser";
import { getSeeds } from "../util/seed.js";
import _ from "underscore";
import "mocha";

const assert = chai.assert;

describe('Logical Operators', function(){

    this.timeout(30 * 1000);

    const databaseName = 'mongrowser_test_database';
    let database;
    let seeds = getSeeds();

    before(async function(){
        database = new Mongrowser(databaseName);
        await database.import(seeds);
    });

    it('$and', () => {
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
                        const collectionRecords = await collection.find({$and: [{_id: seededRecord._id},{name: seededRecord.name}, {number: seededRecord.number}]});
                        testData.push({
                            seed: seededRecord,
                            collectionRecords: collectionRecords
                        });
                    }
                }
                assert(_.every(testData, test => {                    
                    ['collectionRecords'].forEach(key => delete test[key][0].createdAt);
                    return _.isEqual(test.seed, test.collectionRecords[0]);
                }), 'returned collection record does not match seeded record');
                resolve();
            } catch(error){
                reject(error);
            }
        });        
    });

    it('$not', () => {
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
                        const collectionRecords = await collection.find({$not: {name: seededRecord.name}});
                        testData.push({
                            seed: seededRecord,
                            collectionRecords: collectionRecords
                        });
                    }
                }
                assert(_.every(testData, test => {                    
                    test.collectionRecords.forEach((record, _i) => delete test.collectionRecords[_i].createdAt);
                    return _.every(test.collectionRecords, collectionRecord => !_.isEqual(test.seed, collectionRecord));
                }), 'returned collection records should not match seeded record');
                resolve();
            } catch(error){
                reject(error);
            }
        });        
    });

    it('$nor', () => {
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
                        const collectionRecords = await collection.find({$nor: [{name: seededRecord.name}, {number: seededRecord.number}]});
                        testData.push({
                            seed: seededRecord,
                            collectionRecords: collectionRecords
                        });
                    }
                }
                assert(_.every(testData, test => {                    
                    test.collectionRecords.forEach((record, _i) => delete test.collectionRecords[_i].createdAt);
                    return _.every(test.collectionRecords, collectionRecord => !_.isEqual(test.seed, collectionRecord));
                }), 'returned collection records should not match seeded record');
                resolve();
            } catch(error){
                reject(error);
            }
        });        
    });

    it('$or', () => {
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
                        const collectionRecords = await collection.find({$or: [{name: seededRecord.name}, {number: seededRecord.number}]});
                        testData.push({
                            seed: seededRecord,
                            collectionRecords: collectionRecords
                        });
                    }
                }
                assert(_.every(testData, test => {                    
                    test.collectionRecords.forEach((record, _i) => delete test.collectionRecords[_i].createdAt);
                    return _.every(test.collectionRecords, collectionRecord => _.isEqual(test.seed, collectionRecord));
                }), 'returned collection record should match seeded record');
                resolve();
            } catch(error){
                reject(error);
            }
        });        
    });

});