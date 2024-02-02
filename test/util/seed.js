export const getSeeds = () => {
    try {
        const testRecords = {};
        for( let i = 0; i < 4; i++){
            testRecords[`testCollection${i + 1}`] = [];
            for(let _i = 0; _i < 100; _i++){
                testRecords[`testCollection${i + 1}`].push({
                    _id: crypto.randomUUID(),
                    name: `testRecord ${_i + 1}`,
                    number: _i + 1,
                    number2: 100 - _i,
                    inRange: []
                });
            }
        }
        return testRecords;        
    } catch(error){
        console.error(`Mongrowser Seeding Error: ${error.message}`);
        
    }    
}