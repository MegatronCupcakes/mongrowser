import Mongrowser from "mongrowser";
import { getSeeds } from "../util/seed.js";
import _ from "underscore";
import "mocha";

const assert = chai.assert;

describe('Miscellaneous Query Operators', function(){

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

    it('$rand', () => {
        return new Promise(async (resolve, reject) => {
            try {                
                const testData = [];
                const collectionNames = Object.keys(seeds);
                for(let i = 0; i < collectionNames.length; i++){
                    const query = {number: {$lt: {$floor: {$multiply: [{$rand: {}}, 100]}}}};
                    const collectionName = collectionNames[i];
                    const collection = await database.getCollection(collectionName);
                    const _results = await collection.find(query);
                    testData.push({
                        query: query,
                        count: _results.length,
                        collectionRecords: _results                        
                    });
                }
                assert(testData.every(test => test.count == test.query.number.$lt - 1), 'test returned too many records');
                assert(testData.every(test => test.collectionRecords.every(record => record.number < test.query.number.$lt)), 'return records should have a number less than the random number generated by the query');
                resolve();
            } catch(error){
                reject(error);
            }
        });        
    });
    
});