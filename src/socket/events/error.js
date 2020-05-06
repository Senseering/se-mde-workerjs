let client = require('../client')


/**
 * Sends error message to the manager
 * @param {Object} message the error message
 */
let error = async function (message) {
    try {
        toPublishMsg = {
            statusID: message.statusID,
            timestamp: Date.now(),
            msg: message.msg,
            code: message.code
        }

        client.socket.transmit('error', 'unsent', toPublishMsg)
    } catch (err) {
        debug(('Error: ' + err).red)
    }
}

module.exports = error