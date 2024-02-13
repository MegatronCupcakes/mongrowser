import { queryEvaluator } from "../lib/queryEvaluator.js";
import { isNumeric } from "./isNumeric.js";

export const applyProjections = (document, searchObject, removeFields, returnFields, projections) => {
    // ToDo: account for dotnotation.... not sure how to do this yet.                 
    let _document = { ...document };
    let _documentShell = { _id: document._id };
    
    if (removeFields) {
        removeFields.forEach(removeField => {
            if (removeField.includes(".")) {
                throw new Error("DBAccess: projection fields: dot notation support not implemented (yet)");
            } else {
                if (removeField !== "_id") delete _document[removeField];
            }
        });
    }

    if (returnFields) {
        returnFields.forEach(async returnField => {
            if (returnField.includes(".")) {
                throw new Error("DBAccess: projection fields: dot notation support not implemented (yet)");
            } else {
                _documentShell[returnField] = _document[returnField] ? _document[returnField] : null;
            }
            _document = _documentShell;
        });
    }

    if (projections) {
        for (let _i = 0; _i < projections.length; _i++) {
            const projection = projections[_i];
            let _projectionField;
            switch (projection.type) {
                case "$":
                    if (projection.projection.includes(".")) {
                        throw new Error("DBAccess: projection fields: dot notation support not implemented (yet)");
                    } else {
                        for (let i = 0, matched = false; i < document[projection.projection].length && !matched; i++) {
                            const fieldValue = document[projection.projection][i];
                            const matchDoc = {
                                ...document
                            };
                            delete matchDoc[projection.projection];
                            matchDoc[projection.projection] = [fieldValue];
                            const evaluation = queryEvaluator(searchObject).every(evaluation => evaluation(matchDoc));
                            if (evaluation) {
                                matchDoc[projection.projection] = matchDoc[projection.projection][0];
                                _document = matchDoc;
                                matched = true;
                            }
                        }
                    }                     
                    break;
                case "$elemMatch":                    
                    _projectionField = Object.keys(projection.projection)[0];
                    if (_projectionField.includes(".")) {
                        throw new Error("DBAccess: projection fields: dot notation support not implemented (yet)");
                    } else {
                        for (let i = 0, matched = false; i < document[_projectionField].length && !matched; i++) {                            
                            const fieldValue = document[_projectionField][i];
                            const matchDoc = {
                                ...document
                            };
                            delete matchDoc[_projectionField];
                            matchDoc[_projectionField] = [fieldValue];
                            const evaluatedBool = queryEvaluator(projection.projection).every(evaluation => evaluation(matchDoc));
                            matchDoc[_projectionField] = evaluatedBool ? fieldValue : null;
                            _document = matchDoc;                                
                            matched = evaluatedBool;
                        }                        
                    }
                    break;
                case "$slice":                    
                    _projectionField = Object.keys(projection.projection)[0];
                    const sliceValue = projection.projection[_projectionField].$slice;
                    if (_projectionField.includes(".")) {
                        throw new Error("DBAccess: projection fields: dot notation support not implemented (yet)");
                    } else {
                        if(Array.isArray(sliceValue) && sliceValue.every(number => isNumeric(number))){
                            // array of two numbers; convert "skip" and "number to return" to a zero-based index values
                            const fromIndex = sliceValue[0] - 1 > 0 ? sliceValue[0] - 1 : sliceValue[0];
                            const toIndex = fromIndex > 0 ? fromIndex + sliceValue[1] : fromIndex - sliceValue[1];
                            _document[_projectionField] = document[_projectionField].slice(fromIndex, toIndex);
                        } else if(!Array.isArray(sliceValue) && isNumeric(sliceValue)){
                            // return one value using the provided "skip" value; convert "skip" to a zero-based index value
                            _document[_projectionField] = document[_projectionField][sliceValue - 1];
                        } else {
                            throw new Error("DBAccess: $slice projection: must provide a number or an array containing two numbers");
                        }                                           
                    }                    
                    break;
            }
                       
        }
    }
    return _document;
}