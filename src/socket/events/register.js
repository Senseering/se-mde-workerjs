const uuidV1 = require('uuid/v1')
const debug = require('debug')('socket:register')
require('colors')

let client = require('../client')
const format = require("../../utils/formatMessages")


/**
 * Registers worker at the manager
 * @param {Object} registration the needed data package to register
 */
let register = async function (registration) {
    try {
        await client.socket.transmit('register', 'initial', registration)
    } catch (error) {
        debug(('Error: ' + error).red)
    }
}

module.exports = register
