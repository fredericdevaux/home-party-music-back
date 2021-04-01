export function findObjectFromArray(array: [], property: string, propertyValue: any) {
    // @ts-ignore
    const index = array.map((item) => item[property]).indexOf(propertyValue)
    if (array[index]) {
        return array[index]
    }

    return {}
}
