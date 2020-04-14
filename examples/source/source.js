let Worker = require('@senseering/worker_js')

let config = './config/development.json'

let worker = new Worker(config);

(async function () {
    await worker.connect()

    let data = { test: 'Hello world!' }
    await worker.publish({ data: data, price: 1 })
})();