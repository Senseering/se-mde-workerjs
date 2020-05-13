const config = require('../../utils/config')
const client = require('../client')

let compare = {}

compare.send = async function (version) {
    await client.socket.transmit('compare', 'initial', { message: version })
    client.config.isCompared.value = new Promise(async function (resolve, reject) {
        client.config.isCompared.resolve = resolve
        let TIMEOUT = (await config.get("settings")).messageTimeout
        client.config.isCompared.timeout = setTimeout(() => {
            reject(new Error("TIMEOUT: " + version + " compare took to long. Timeout set to: " + TIMEOUT ? TIMEOUT : 1000))
        }, TIMEOUT ? TIMEOUT : 1000 )
    })
    return client.config.isCompared.value
}

module.exports = compare