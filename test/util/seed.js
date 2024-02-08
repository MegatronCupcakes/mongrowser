const _recordCount = 100;
const _rangeLength = 3;

export const getSeeds = () => {
    try {
        const testRecords = {};
        for( let i = 0; i < 4; i++){
            testRecords[`testCollection${i + 1}`] = [];
            for(let _i = 0; _i < _recordCount; _i++){  
                const _number = _i + 1;              
                testRecords[`testCollection${i + 1}`].push({
                    _id: crypto.randomUUID(),
                    name: `testRecord ${_i + 1}`,
                    number: _number,
                    number2: _recordCount - _i,
                    range: _createRange(_number, 'testRecord '),
                    numberRange: _createRange(_number)
                });
            }
        }
        return testRecords;        
    } catch(error){
        console.error(`Mongrowser Seeding Error: ${error.message}`);
        
    }    
}

const _createRange = (number, prefix) => {
    const range = [];
    for(let i = 1; i <= _rangeLength; i++){
        const down = number - i;
        if(down > 0) range.push(prefix ? `${prefix}${down}` : down);
    }
    for(let i = 1; i <= _rangeLength; i++){
        const up = number + i;
        if(up <= _recordCount) range.push(prefix ? `${prefix}${up}` : up);
    }
    range.sort((a,b) => {
        return prefix ? Number(a.split(" ")[1]) - Number(b.split(" ")[1]) : a - b;
    });
    return range;
}