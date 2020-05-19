const config = require('../../utils/config')
const client = require('../client')

let compare = {}

compare.send = async function (version) {
    await client.socket.transmit('compare', 'initial', { message: version })
    client.config.isCompared.value = new Promise(async function (resolve, reject) {
        client.config.isCompared.resolve = resolve
        client.config.isCompared.reject = reject
        let TIMEOUT = (await config.get("settings")).messageTimeout
        TIMEOUT = (TIMEOUT ? TIMEOUT : 1000)
        client.config.isCompared.timeout = setTimeout(() => {
            reject(new Error("TIMEOUT: Compare took to long. Timeout set to: " + TIMEOUT))
        }, TIMEOUT )
    })
    return client.config.isCompared.value
}

module.exports = compare