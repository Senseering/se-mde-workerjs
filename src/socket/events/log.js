let client = require('../client')


/**
 * Sends log message to the manager
 * @param {Object} message the log message
 */
let log = async function (message) {
    try {
        toPublishMsg = {
            statusID: message.statusID,
            timestamp: Date.now(),
            msg: message.msg,
            code: message.code
        }

        client.socket.transmit('log', 'unsent', toPublishMsg)
    } catch (err) {
        debug(('Error: ' + err).red)
    }
}

module.exports = log