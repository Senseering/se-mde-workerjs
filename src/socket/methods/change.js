const config = require('../../utils/config/config')
const client = require('../client')

let change = {}

change.send = async function (change) {
    await client.socket.transmit({ topic: 'change', message: change })//'change', 'initial', { message: change })
    client.config.isChanged.value = new Promise(async function (resolve, reject) {
        client.config.isChanged.resolve = resolve
        client.config.isChanged.reject = reject
        let TIMEOUT = (await config.get("settings")).messageTimeout
        TIMEOUT = (TIMEOUT ? TIMEOUT : 1000)
        client.config.isChanged.timeout = setTimeout(() => {
            reject(new Error("TIMEOUT: Retreiving changes took to long. Timeout set to: " + TIMEOUT))
        }, TIMEOUT)
    })
    return client.config.isChanged.value
}

module.exports = change