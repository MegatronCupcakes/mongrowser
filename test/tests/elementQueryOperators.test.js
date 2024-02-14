import Mongrowser from "mongrowser";
import { getSeeds } from "../util/seed.js";
import _ from "underscore";
import "mocha";

const assert = chai.assert;

describe('Element Query Operators', function(){

    this.timeout(30 * 1000);

    const databaseName = 'mongrowser_test_database';
    let database;
    let seeds = getSeeds();

    before(async function(){
        database = new Mongrowser(databaseName);
        await database.import(seeds);
    });

    it('$exists', () => {
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
                            validExists: await collection.find({name: {$exists: true}}),
                            validNotExists: await collection.find({name: {$exists: false}}),
                            invalidExists: await collection.find({notName: {$exists: true}}),
                            invalidNotExists: await collection.find({notName: {$exists: false}})
                        });
                    }
                }
                assert(_.every(testData, test => {                    
                    test.validExists.forEach((record, _i) => delete test.validExists[_i].createdAt);
                    return _.every(test.validExists, collectionRecord => Object.hasOwn(collectionRecord, "name"));
                }), 'returned collection records missing required property');
                assert(_.every(testData, test => {                                        
                    return _.isArray(test.validNotExists) && test.validNotExists.length == 0;
                }), 'result set should be a zero-length array');
                
                assert(_.every(testData, test => {                                        
                    return _.isArray(test.invalidExists) && test.invalidExists.length == 0;
                }), 'result set should be a zero-length array');
                assert(_.every(testData, test => {                    
                    test.invalidNotExists.forEach((record, _i) => delete test.invalidNotExists[_i].createdAt);
                    return _.every(test.invalidNotExists, collectionRecord => Object.hasOwn(collectionRecord, "notName"));
                }), 'returned collection records missing required property');
                resolve();
            } catch(error){
                reject(error);
            }
        });        
    });

    it('$type', () => {
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
                            existsRecords: await collection.find({name: {$type: "string"}}),
                            notExistsRecords: await collection.find({name: {$type: "boolean"}})
                        });
                    }
                }
                assert(_.every(testData, test => {                    
                    test.existsRecords.forEach((record, _i) => delete test.existsRecords[_i].createdAt);
                    return _.every(test.existsRecords, collectionRecord => _.isString(collectionRecord.name));
                }), 'returned collection records missing required property type');
                assert(_.every(testData, test => {                                        
                    return _.isArray(test.notExistsRecords) && test.notExistsRecords.length == 0;
                }), 'result set should be a zero-length array');
                resolve();
            } catch(error){
                reject(error);
            }
        });        
    });

});