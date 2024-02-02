/*
    because we don't return a cursor, we'll implement query options like Meteor does:
    https://docs.meteor.com/api/collections#Mongo-Collection-find

    Not (yet) Implemented:
        Queries
            Evaluation Query Operators: '$jsonSchema', '$regex', '$text', '$where'
            Array Query Operators: '$all', '$elemMatch', '$size'
            Geospatial Query Operators
            Bitwise Query Operators
            Projection Operators
            Miscellaneous Query Operators
        Updates
            Field Update Operators: '$setOnInsert'
            Array Update Operators: '$', '$[]', '$[<identifier>]'
            Bitwise Update Operator
        Aggregation
            Aggregation Pipeline Stages
            Aggregation Pipeline Operators
        Other Options
            multi                        
*/

import { init as MongrowserInit } from "./lib/init.js";
import { createIndex as _createIndex} from "./lib/createIndex.js";
import { count } from "./lib/count.js";
import { exportJson } from "./lib/export.js";
import { find } from "./lib/find.js";
import { findOne } from "./lib/findOne.js";
import { importJson } from "./lib/import.js";
import { insert } from "./lib/insert.js";
import { remove } from "./lib/remove.js";
import { update } from "./lib/update.js";
import { dropCollection as _dropCollection } from "./lib/dropCollection.js";
class Mongrowser {

    constructor(databaseName){
        this.databaseName = databaseName;
        this._collections = [];
    }
    getCollection(collectionName, indexFieldArray){
        return new Promise(async (resolve, reject) => {
            try {
                const collection = new _Collection(this.databaseName, collectionName, indexFieldArray);
                await collection._init();
                if(!this._collections.includes(collectionName)) this._collections.push(collectionName);
                resolve(collection);
            } catch(error){
                reject(error);
            }
        });                
    }
    dropCollection(collectionName){
        _dropCollection(this.databaseName, collectionName);
    }
    import(importData){        
        return new Promise(async (resolve) => {
            try {
                if (typeof importData === 'string') importData = JSON.parse(importData);
                const collectionNames = Object.keys(importData);
                for(let i = 0; i < collectionNames.length; i++){
                    const collectionName = collectionNames[i];
                    const collection = await this.getCollection(collectionName);
                    await collection.import(importData[collectionName]);
                    this._close();
                }
                resolve(true);
            } catch (error){
                console.error(`Mongrowser.importDb [${this.databaseName}] ERROR: ${error.message}`);
                resolve(false);
            }
        })
    }
    export(){        
        return exportJson(this.databaseName);
    }
    _close(){
        window._databases[this.databaseName].close();
    }

}

class _Collection {

    constructor(databaseName, collectionName, indexFieldArray){
        this.databaseName = databaseName;
        this.collectionName = collectionName;
        this.indexFieldArray = indexFieldArray || [];
        this.initialized = false;
    }
    async _init(){
        this.initialized = await MongrowserInit(this.databaseName, this.collectionName, this.indexFieldArray);
        return this.initialized;
    }
    createIndex(field){
        field = JSON.stringify(field);
        if(!this.indexFieldArray.includes(field)) this.indexFieldArray.push(field);
        return _createIndex(this.databaseName, this.collectionName, this.indexFieldArray);
    }
    count(){
        return count(this.databaseName, this.collectionName);
    }
    export(){
        return exportJson(this.databaseName, this.collectionName);
    }
    find(searchObject, optionsObject){
        return find(this.databaseName, this.collectionName, searchObject, optionsObject);
    }
    findOne(searchObject, optionsObject){
        return findOne(this.databaseName, this.collectionName, searchObject, optionsObject);
    }
    import(importData){
        return importJson(this.databaseName, this.collectionName, importData);
    }
    insert(document){
        return insert(this.databaseName, this.collectionName, document);
    }
    remove(searchObject){
        return remove(this.databaseName, this.collectionName, searchObject);
    }
    update(searchObject, updateObject){
        return update(this.databaseName, this.collectionName, searchObject, updateObject);
    }

}

export default Mongrowser;