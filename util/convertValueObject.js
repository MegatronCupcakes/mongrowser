export const convertValueObject = (searchObject) => {
    if(typeof searchObject == 'object'){
        Object.keys(searchObject).forEach(key => {
            switch(key){
                case '$multiply':                            
                    searchObject = convertValueObject(searchObject[key][0]) * convertValueObject(searchObject[key][1]);
                    break;
                case '$floor':
                    searchObject = Math.floor(convertValueObject(searchObject[key]));
                    break;
                case '$rand':                        
                    searchObject = Math.random();
                    break;
                default:
                    if(typeof searchObject[key] == 'object' || Array.isArray(searchObject[key])) searchObject[key] = convertValueObject(searchObject[key]);
                    break;
            }
        });
    } else if (Array.isArray(searchObject)){
        searchObject.forEach(key => {
            if(typeof searchObject[key] == 'object' || Array.isArray(searchObject[key])) searchObject[key] = convertValueObject(searchObject[key]);            
        });
    }            
    return searchObject;
}