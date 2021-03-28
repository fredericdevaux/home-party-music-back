export function deleteObjectFromArray(array: [], property: string, propertyValue: any) {
    // @ts-ignore
    const removeIndex = array.map((item) => item[property]).indexOf(propertyValue)
    array[removeIndex] && array.splice(removeIndex, 1)
}
