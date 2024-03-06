export const convertValueObject = (originalObject) => {
    if(typeof originalObject == 'object'){
        Object.keys(originalObject).forEach(key => {
            switch(key){
                case '$multiply':                            
                    originalObject = convertValueObject(originalObject[key][0]) * convertValueObject(originalObject[key][1]);
                    break;
                case '$floor':
                    originalObject = Math.floor(convertValueObject(originalObject[key]));
                    break;
                case '$rand':                        
                    originalObject = Math.random();
                    break;
                case '$currentDate':
                    if(
                        typeof originalObject[key] == 'object' &&
                        Object.hasOwn(originalObject[key], '$type') && 
                        (originalObject[key].$type == 'timestamp' || originalObject[key].$type == 'date')
                    ){
                        switch(originalObject[key].$type){
                            case 'date':
                                originalObject = new Date();
                                break;
                            case 'timestamp':
                                originalObject = Date.now();
                                break;
                        }
                    } else if(typeof originalObject[key] == 'boolean' && originalObject[key]){
                        originalObject = new Date();
                    } else {
                        throw new Error(`convertValueObject error: $currentDate invalid format`);
                    }
                    break;
                default:
                    if(typeof originalObject[key] == 'object' || Array.isArray(originalObject[key])) originalObject[key] = convertValueObject(originalObject[key]);
                    break;
            }
        });
    } else if (Array.isArray(originalObject)){
        originalObject.forEach(key => {
            if(typeof originalObject[key] == 'object' || Array.isArray(originalObject[key])) originalObject[key] = convertValueObject(originalObject[key]);            
        });
    }            
    return originalObject;
}

export const convertStoredDates = (originalObject) => {
    if(typeof originalObject == 'object' && !(originalObject instanceof Date) && originalObject != null){
        Object.keys(originalObject).forEach(key => {
            if(typeof originalObject[key] == 'string' && originalObject[key].includes(':') && originalObject[key].includes('Z')){
                try {
                    originalObject[key] = new Date(originalObject[key])
                } catch(error){
                    // do nothing.
                }
            }
            if((typeof originalObject[key] == 'object' || Array.isArray(originalObject[key])) && !(originalObject[key] instanceof Date)) originalObject[key] = convertStoredDates(originalObject[key]);
        });
    } else if (Array.isArray(originalObject)){
        originalObject.forEach(key => {
            if((typeof originalObject[key] == 'object' || Array.isArray(originalObject[key])) && !(originalObject[key] instanceof Date)) originalObject[key] = convertStoredDates(originalObject[key]);            
        });
    }            
    return originalObject;
}