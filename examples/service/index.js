let Worker = require('../../src/worker')

let config = './config/development.json'

let worker = new Worker(config);

(async function () {
    await worker.connect()

    let data = { test: 'Hello World!' }
    await worker.publish({ data: data, price: 0 })

    //publishes data only on demand
    let service = async () => {
        return { data: data, price: 0 }
    }

    worker.provide(service)
})();