const config = require('../../utils/config')
const client = require('../client')

let update = {}

update.send = async function (missingConfig) {
    await client.socket.transmit('update', 'unsent', { message: missingConfig })
    client.config.isUpdated.value = new Promise(async function (resolve, reject) {
        client.config.isUpdated.resolve = resolve
        let TIMEOUT = (await config.get("settings")).messageTimeout
        setTimeout(() => {
            reject(new Error("TIMEOUT: Update took to long. Timeout set to: " + TIMEOUT ? TIMEOUT : 1000))
        }, TIMEOUT ? TIMEOUT : 1000 )
    })
    return client.config.isUpdated.value
}

module.exports = update