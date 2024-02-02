import { isNumeric } from "./isNumeric.js";

export const convertToBool = (value) => {
    if(typeof value == 'string'){
        if(value.toLowerCase() === 'true') return true;
        if(value.toLowerCase() === 'false') return false; 
    }
    if(isNumeric(value)){
        if(Number(value) == 0) return false;
        if(Number(value) == 1) return true;
    }
    return value;
}