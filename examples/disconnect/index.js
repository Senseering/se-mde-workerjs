let Worker = require('../../src/worker')

let config = './config/development.json'

function Sleep(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}

let worker = new Worker(config);

(async function () {
    await worker.connect()

    let data = { test: 'Hello world!' }
    await worker.publish({ data: data, price: 0 })
    await worker.disconnect()

    await Sleep(10000)

    await worker.connect()
    await worker.publish({ data: data, price: 0 })
    await worker.disconnect()
})();