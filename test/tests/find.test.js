import Mongrowser from "mongrowser";
import { getSeeds } from "../util/seed.js";
import _ from "underscore";
import "mocha";

const assert = chai.assert;

describe('Collection Find', function(){

    this.timeout(30 * 1000);

    const databaseName = 'mongrowser_test_database';
    let database;
    let seeds = getSeeds();

    before(async function(){
        database = new Mongrowser(databaseName);
        await database.import(seeds);
    });

    it('find all records with empty search object', () => {
        return new Promise(async (resolve, reject) => {
            try {
                const collectionNames = Object.keys(seeds);
                const counts = [];
                for(let i = 0; i < collectionNames.length; i++){
                    const collectionName = collectionNames[i];
                    const results = await (await database.getCollection(collectionName)).find({});
                    counts.push({
                        seedCount: seeds[collectionName].length,
                        count: results.length,
                        collectionName: collectionName,
                        results: results
                    });
                }        
                assert(_.every(counts, count => count.seedCount == count.count), 'returned collection record count does not match seeded record count');
                assert(_.every(counts, count => _.isArray(count.results)), 'collection find method did not return an Array');
                assert(_.every(counts, count => _.every(count.results, result => {
                    delete result.createdAt;
                    const seed = _.findWhere(seeds[count.collectionName], {_id: result._id});
                    return _.isEqual(result, seed);
                })), 'returned collection record does not match seeded record');
                resolve();
            } catch(error){
                reject(error);
            }
        });        
    });

    it('find all records by specified property', () => {
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
                        const collectionRecordById = await collection.find({_id: seededRecord._id});                        
                        const collectionRecordByName = await collection.find({name: seededRecord.name});
                        const collectionRecordByNumber = await collection.find({number: seededRecord.number});
                        testData.push({
                            seed: seededRecord,
                            byId: collectionRecordById,
                            byName: collectionRecordByName,
                            byNumber: collectionRecordByNumber
                        });
                    }
                }
                assert(_.every(testData, test => {
                    return _.isArray(test.byId) && _.isArray(test.byName) && _.isArray(test.byNumber);
                }), 'collection find method did not return an Array');
                assert(_.every(testData, test => {
                    return test.byId.length == 1 && test.byName.length == 1 && test.byNumber.length == 1;
                }), 'collection find method did not return an Array with length of 1');
                assert(_.every(testData, test => {                    
                    ['byId', 'byName', 'byNumber'].forEach(key => delete test[key][0].createdAt);
                    return _.isEqual(test.seed, test.byId[0]) && _.isEqual(test.seed, test.byName[0]) && _.isEqual(test.seed, test.byNumber[0]);
                }), 'returned collection record does not match seeded record');
                resolve();
            } catch(error){
                reject(error);
            }
        });        
    });

});