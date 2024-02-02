export const getVersion = (databaseName) => {
    return new Promise((resolve, reject) => {
        const request = window.indexedDB.open(databaseName);
        request.onsuccess = (event) => {
            const database = event.target.result;
            const version = database.version;
            database.close();
            resolve(version);
        };
        request.onerror = (error) => reject(error);
    });
}