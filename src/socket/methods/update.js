const config = require('../../utils/config/config')
const client = require('../client')

let update = {}

update.send = async function (missingConfig) {
    await client.socket.transmit('update', 'initial', { message: missingConfig })
    client.config.isUpdated.value = new Promise(async function (resolve, reject) {
        client.config.isUpdated.resolve = resolve
        client.config.isUpdated.reject = reject
        let TIMEOUT = (await config.get("settings")).messageTimeout
        TIMEOUT = (TIMEOUT ? TIMEOUT : 1000)
        client.config.isUpdated.timeout = setTimeout(() => {
            reject(new Error("TIMEOUT: Update took to long. Timeout set to: " + TIMEOUT))
        }, TIMEOUT )
    })
    return client.config.isUpdated.value
}

module.exports = update