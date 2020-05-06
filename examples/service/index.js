let Worker = require('../../src/worker')

let config = './config.json'

let worker = new Worker();

(async function () {
    await worker.connect(config)

    let data = { test: 'Hello World!' }
    await worker.publish(data, { price: 0 })

    //publishes data only on demand
    let service = async (incomingData, log) => {
        //do something
        log('Processing data')

        if (typeof ('test') !== 'object') {
            throw new Error('Invalid data')
        }
        return data
    }

    worker.provide(service)
})();