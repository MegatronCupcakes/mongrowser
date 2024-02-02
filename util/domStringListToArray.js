export const domStringListToArray = (list) => {
    const listArray = [];
    let endOfList = false;
    let i = 0;
    try {
        while(!endOfList){
            const name = list.item(i);
            if(name.length > 0){
                listArray.push(name);
            }
            i++; 
        }
    } catch (error) {
        endOfList = true;
    }    
    return listArray;
}