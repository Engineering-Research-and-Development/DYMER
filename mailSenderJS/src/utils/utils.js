module.exports = {
    nestedToFlatten: function (obj, curr = {}) {
        let flattenObj = curr

        if (typeof obj !== "object")
            throw new Error("Object Expected")

        if (Object.keys(obj).length === 0) return obj

        for (let key in obj) {
            if (typeof obj[key] !== "object" || Array.isArray(obj[key])) {
                flattenObj[key] = obj[key]
            } else {
                this.nestedToFlatten(obj[key], flattenObj)
            }
        }

        return flattenObj
    }
}