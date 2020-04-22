let Worker = require('../../src/worker')

let config = './config/development.json'

let worker = new Worker(config);

(async function () {
    await worker.connect()

    let data = { test: 'Hello World!' }
    await worker.publish(data, { price: 0 })

    //publishes data only on demand
    let service = async (incomingData) => {
        //doo something
        return data
    }

    worker.provide(service)
})();