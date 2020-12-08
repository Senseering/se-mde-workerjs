const client = require('../../client')
const config = require('../../../utils/config/config')

let init = {}

init.send = async function (change) {
    await client.socket.transmit({ topic: 'worker/state/change', message: change })
}

module.exports = init