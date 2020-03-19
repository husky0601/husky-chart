export const suffixes = ['s', 'k', 'gb', 'kg', 'kb', 'lbs']

export function generateAxis(){
    const length = 6 + Math.floor(6 * Math.random())
    let items = []
    for(let i = 0; i < length; i++){
        items.push({
            label: `${i}${suffixes[length % suffixes.length]}`,
            value: i ,
        })
    }
    return items
}