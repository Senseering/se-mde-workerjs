const debug = require('debug')('socket:register')
let client = require('../client')
const format = require("../../utils/formatMessages")
require('colors')

let register = {}


/**
 * Registers at the manager
 * @param {Object} url The manager url
 * @param {Object} registration the needed data package to register
 */
register.submit = async function (url, registration) {
    // Run the request to register a machine
    debug('url: ' + url)
    try {
        return new Promise((resolve) => {
            client.socket.send(format.output('register', registration), (callback) => {
                resolve(callback)
            })
        })

    } catch (error) {
        debug(('Error: ' + error).red)
    }
}

module.exports = register
