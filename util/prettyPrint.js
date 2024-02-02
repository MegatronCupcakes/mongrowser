export const prettyPrint = (object) => {
    return JSON.stringify(object, (key, value) => {
        if(typeof value == 'function') return 'fn()';
        return value;
    }, 4);
}