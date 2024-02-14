import Mongrowser from "mongrowser";
import { getSeeds } from "../util/seed.js";
import _ from "underscore";
import "mocha";

const assert = chai.assert;

const databaseName = 'mongrowser_test_database';
const seeds = getSeeds();
let database;

const assertions = {
    collectionsCreated: async () => {
        let collectionNames;
        const seedCollectionNames = Object.keys(seeds);
        try {
            collectionNames = await new Promise((resolve, reject) => {
                const indexedDbRequest = window.indexedDB.open(databaseName);
                indexedDbRequest.onsuccess = (event) => {
                    const _database = event.target.result;
                    const _names = Object.keys(_database.objectStoreNames).map(key => _database.objectStoreNames[key]);                    
                    _database.close();
                    resolve(_names);
                }
                indexedDbRequest.onerror = (error) => reject(error);
            })
        } catch(error){
            console.log(`test error: ${error.message}`);
        }
        assert(collectionNames.length == seedCollectionNames.length, 'collection names do not match seeded collection names');
        assert(_.union(collectionNames, seedCollectionNames).length == collectionNames.length, 'union of seeded collection names and collection names do not match collection names');
        assert(_.union(collectionNames, seedCollectionNames).length == seedCollectionNames.length, 'union of seeded collection names and collection names do not match seeded collection names');
    },
    recordCountCorrect: async () => {
        const seedCollectionNames = Object.keys(seeds);
        const counts = [];
        for(let i = 0; i < seedCollectionNames.length; i++){
            const collectionName = seedCollectionNames[i];
            counts.push({
                seedCount: seeds[collectionName].length,
                count: await (await database.getCollection(collectionName)).count()
            });
        }
        assert(_.every(counts, count => count.seedCount == count.count), 'collection record count and seeded record count do not match');
    }
}

describe('Database Import', function(){

    before(async function(){
        database = new Mongrowser(databaseName);
        await database.import(seeds);        
    });

    it('collections are created', () => {
        assertions.collectionsCreated();
    });

    it('collections contain the correct number of records', () => {
        assertions.recordCountCorrect();
    });

});

describe('Collection Import', function(){

    const databaseName = 'mongrowser_test_database';
    let database;
    let seeds = getSeeds();

    before(async function(){
        database = new Mongrowser(databaseName);
        const collectionNames = Object.keys(seeds);
        for(let i = 0; i < collectionNames.length; i++){
            const collectionName = collectionNames[i];
            await (await database.getCollection(collectionName)).import(seeds[collectionName]);
        }
    });

    it('collections are created', () => {
        assertions.collectionsCreated();
    });

    it('collections contain the correct number of records', () => {
        assertions.recordCountCorrect();
    });
});