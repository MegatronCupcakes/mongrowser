export const getOptionDetails = (optionsObject) => {
    const sortIndex = (optionsObject && 'sort' in optionsObject) ? Object.keys(optionsObject.sort)[0] : null;
    const sortKeyword = sortIndex ? _getSortKeyword(optionsObject.sort[sortIndex]) : null;
    const skip = (optionsObject && 'skip' in optionsObject) ? optionsObject.skip : null;
    const limit = (optionsObject && 'limit' in optionsObject) ? optionsObject.limit : null;
    const fields = (optionsObject && 'fields' in optionsObject) ? Object.keys(optionsObject.fields) : null;
    const removeFields = fields ? [] : null;
    const returnFields = fields ? [] : null;
    if (fields) {
        fields.forEach(field => {
            if (optionsObject.fields[field] == 0) removeFields.push(field);
            if (optionsObject.fields[field] == 1) returnFields.push(field);
        });
    }
    return [sortIndex, sortKeyword, skip, limit, removeFields, returnFields];
}

const _getSortKeyword = (numericValue) => {
    try {
        numericValue = Number(numericValue);
        if (numericValue == 1) return "next";
        if (numericValue == -1) return "prev";
        return null;
    } catch (error) {
        return null;
    }
}