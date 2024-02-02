export const recursiveKeySearch = (obj, searchKey, keyFound = false) => {
    const keys = Object.keys(obj);
    for(let i = 0; i < keys.length && !keyFound; i++){
        keyFound = keys[i] == searchKey;
        if(!keyFound && typeof obj[keys[i]] == 'object') recursiveKeySearch(obj[keys[i]], searchKey, keyFound);
    }
    return keyFound;
};