let Worker = require('@senseering/worker_js')

let config = './config/development.json'

let worker = new Worker(config);

(async function () {
    await worker.connect()

    //publishes data only on demand
    let service = async () => {
        for (var key of Object.keys(params)) {
            data[key] = params[key]
        }

        return { data: data, price: 1 }
    }

    worker.provide(service)
})();