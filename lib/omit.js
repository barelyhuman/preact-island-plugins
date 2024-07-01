/**
 * @type {import("./types.d.ts").SimpleOmit}
 */
exports.simpleOmit = (obj, props) => {
  const result = {}
  for (let existingProp of Object.getOwnPropertyNames(obj)) {
    if (props.includes(existingProp)) {
      continue
    }
    result[existingProp] = obj[existingProp]
  }
  return result
}
