import Mongrowser from "mongrowser";
import { getSeeds } from "../util/seed.js";
import _ from "underscore";
import "mocha";

const assert = chai.assert;

describe('Collection Insert', function(){

    this.timeout(30 * 1000);

    const databaseName = 'mongrowser_test_database';
    let database;
    let seeds = getSeeds();

    before(async function(){
        database = new Mongrowser(databaseName);
    });

    it('insert records', () => {
        return new Promise(async (resolve, reject) => {
            try {
                const testData = [];
                const collectionNames = Object.keys(seeds);                
                for(let i = 0; i < collectionNames.length; i++){
                    const collectionName = collectionNames[i];
                    const collection = await database.getCollection(collectionName);
                    for(let _i = 0; _i < seeds[collectionName].length; _i++){
                        const seed = seeds[collectionName][_i];
                        testData.push({
                            collection: collection,
                            seed: seed,
                            insertedId: await collection.insert(seed)
                        });                        
                    }
                }        
                assert(_.every(testData, async test => {
                    let insertedDoc = await test.collection.findOne({_id: test.insertedId});
                    delete insertedDoc._id;
                    return JSON.stringify(test.seed) == JSON.stringify(insertedDoc);
                }), 'inserted document should match seed');
                resolve();
            } catch(error){
                reject(error);
            }
        });        
    });

});