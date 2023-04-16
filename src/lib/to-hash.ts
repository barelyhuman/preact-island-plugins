// Tiny hasher implementation from
// https://github.com/cristianbote/goober/blob/2b2d422711f44e0237564f582053c499b9e92334/src/core/to-hash.js

/**
 * Transforms the input into a className.
 * The multiplication constant 101 is selected to be a prime,
 * as is the initial value of 11.
 * The intermediate and final results are truncated into 32-bit
 * unsigned integers.
 * @param {String} str
 * @returns {String}
 */
export let toHash = (str: string) => {
  let i = 0,
    out = 11
  while (i < str.length) out = (101 * out + str.charCodeAt(i++)) >>> 0
  return 'is' + out
}
