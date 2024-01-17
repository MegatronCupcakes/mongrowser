export const db = (databaseName, objectStoreName, permissions) => {
    try {
        const _transaction = window._databases[databaseName].transaction(objectStoreName, permissions);
        const _objectStore = _transaction.objectStore(objectStoreName);
        return _objectStore;
    } catch (error) {
        throw new Error(`DBAccess Error: "${error.message}" - is the database initialized?`);
    }
}