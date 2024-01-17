export const isNumeric = (value) => {
    try {
        Number(value);
        return true;
    } catch (error) {
        return false;
    }
}