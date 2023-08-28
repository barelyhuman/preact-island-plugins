const { generateIslands, getManifest } = require('./lib/plugin')
const { ALLOWED_EXTENSIONS } = require('./lib/constants')

exports.generateIslands = generateIslands
exports.getManifest = getManifest
exports.ALLOWED_EXTENSIONS = ALLOWED_EXTENSIONS
