const client = require('../../client')
const config = require('../../../utils/config/config')

let init = {}

init.send = async function (init) {
    await client.socket.transmit({ topic: 'worker/state/init', message: init })
    client.state.isInitalised.value = new Promise(async function (resolve, reject) {
        client.state.isInitalised.resolve = resolve
        client.state.isInitalised.reject = reject
        let TIMEOUT = (await config.get("settings")).messageTimeout
        TIMEOUT = (TIMEOUT ? TIMEOUT : 1000)
        client.state.isInitalised.timeout = setTimeout(() => {
            reject(new Error("TIMEOUT: Inital state took to long. Timeout set to: " + TIMEOUT))
        }, TIMEOUT)
    })
    return client.state.isInitalised.value
}

module.exports = init