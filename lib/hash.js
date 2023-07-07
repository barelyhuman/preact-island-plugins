// Tiny hasher implementation from
// https://github.com/cristianbote/goober/blob/2b2d422711f44e0237564f582053c499b9e92334/src/core/to-hash.js

exports.toHash = toHash

/**
 * Transforms the input into a className.
 * The multiplication constant 113 is selected to be a prime,
 * as is the initial value of 11.
 * The intermediate and final results are truncated into 32-bit
 * unsigned integers.
 *
 * --Detailed--
 * Each character of the string is converted to it's unicode value
 * which is added to the integer value (out) from the previous iteration
 * which to start with is 11 here.
 *
 * This being multiplied by 101 has no specific result and could be any number.
 * The result of this is then shifted right, specifically unsigned right shift
 * which is required since we need positive integer values.
 *
 * Since JS's unsigned right shift doesn't support BigInts you end up with a
 * 32bit integer value
 *
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Unsigned_right_shift
 *
 * @param {String} str
 * @returns {String}
 */
function toHash(str) {
  let i = 0,
    out = 11
  while (i < str.length) out = (113 * out + str.charCodeAt(i++)) >>> 0
  return 'is' + out
}
