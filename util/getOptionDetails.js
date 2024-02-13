export const getOptionDetails = (optionsObject) => {
    let sortIndex, sortKeyword, skip, limit, fields, $Projection, $elemMatchProjection, $sliceProjection = null;
    
    if(optionsObject){
        if(Object.hasOwn(optionsObject, "sort")){
            sortIndex = Object.keys(optionsObject.sort)[0];
            sortKeyword = _getSortKeyword(optionsObject.sort[sortIndex]);
        }
        if(Object.hasOwn(optionsObject, "skip")) skip = optionsObject.skip;
        if(Object.hasOwn(optionsObject, "limit")) limit = optionsObject.limit;
        if(Object.hasOwn(optionsObject, "fields")) fields = Object.keys(optionsObject.fields);        
        $Projection = Object.keys(optionsObject).filter(key => {
            return key.includes('.$') ||
                Object.hasOwn(optionsObject[key], "$elemMatch") ||
                Object.hasOwn(optionsObject[key], "$slice")
        });
    }
    
    const removeFields = fields ? [] : null;
    const returnFields = fields ? [] : null;
    if (fields) {
        fields.forEach(field => {
            if (optionsObject.fields[field] == 0) removeFields.push(field);
            if (optionsObject.fields[field] == 1) returnFields.push(field);
        });
    }

    const projections = $Projection || $elemMatchProjection || $sliceProjection ? [] : null;
    if($Projection){
        $Projection.forEach($projection => {
            if($projection.includes('.$')){
                projections.push({type: '$', projection: $projection.replace('.$', '')});
            } else {
                // examine the first subKey
                Object.keys(optionsObject[$projection]).forEach(subkey => {
                    projections.push({type: subkey, projection: {[$projection]: optionsObject[$projection]}});
                });
            }            
        });
    }
    
    return [sortIndex, sortKeyword, skip, limit, removeFields, returnFields, projections];
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