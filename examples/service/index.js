let Worker = require('../../src/worker')

let config = './config/development.json'

let worker = new Worker(config);

(async function () {
    await worker.connect()

    let data = { test: 'Hello World!' }
    await worker.publish(data, { price: 0 })

    //publishes data only on demand
    let service = async (incomingData, statusID) => {
        //do something
        worker.log({ msg: 'Processing data', statusID: statusID })
        if (typeof (data) !== 'object') {
            worker.error({ msg: 'Invalid data', code: 1, statusID: statusID })
            throw new Error('Invalid data')
        }
        return data
    }

    worker.provide(service)
})();