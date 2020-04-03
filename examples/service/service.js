let Worker = require('worker_js')

let config = './config/development.json'

let worker = new Worker(config);

(async function () {
    await worker.connect()

    /*params = {key_1: value_1, ...}
    * example service: writes every entry of params to data
    */
    service = async (data, params) => {
        for (var key of Object.keys(params)) {
            data[key] = params[key]
        }

        return data
    }

    worker.on((async (data, params) => {
        let result = await service(data, params)
        await worker.send(result)
    }))
})();