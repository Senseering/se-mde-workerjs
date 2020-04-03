const debug = require('debug')('socket:output')
let client = require('../client')
const format = require("../../utils/formatMessages")

require("colors")

let output = {}


/**
 * Sends the output data to the edge node
 * @param {Object} url The edge node url
 * @param {Object} data The actual data package that should be send
 */
output.send = async function (data, resolve) {
    try {
        client.succsessfullySend(data.data._id, resolve)
        client.socket.send(format.output('send', data))
        debug("data published")

    } catch (error) {
        debug(error.message.red)
    }
}

module.exports = output
