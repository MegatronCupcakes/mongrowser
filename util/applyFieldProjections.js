export const applyFieldProjection = (document, removeFields, returnFields) => {
    return new Promise((resolve, reject) => {
        try {
            // ToDo: account for dotnotation.... not sure how to do this yet.     
            if (!removeFields && !returnFields) resolve(document);
            let _document = { ...document };
            let _documentShell = {};
            removeFields.forEach(removeField => {
                if (removeField.includes(".")) {
                    const removeSubFields = removeField.split(".");
                    console.log("DBAccess: projection fields: dot notation support not implemented (yet)");
                } else {
                    delete _document[removeField];
                }
            });
            returnFields.forEach(async returnField => {
                if (returnField.includes(".")) {
                    const returnSubFields = returnField.split(".");
                    console.log("DBAccess: projection fields: dot notation support not implemented (yet)");
                } else {
                    _documentShell[returnField] = _document[returnField] ? _document[returnField] : null;
                }
                _document = _documentShell;
            });
            resolve(_document);
        } catch (error) {
            reject(error);
        }
    });
}