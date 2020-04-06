const debug = require('debug')('socket:register')
let client = require('../client')
const format = require("../../utils/formatMessages")
require('colors')

let register = {}


/**
 * Registers at the manager
 * @param {Object} registration the registration info to register at manager
 */
register.submit = async function (registration) {
    try {
        client.socket.send(format.output('register', registration))
    } catch (error) {
        debug(('Error: ' + error).red)
    }
}

module.exports = register
