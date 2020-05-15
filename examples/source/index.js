let Worker = require('../../index')

let config = './config.json';

let worker = new Worker();

(async function () {
    await worker.connect(config)

    let data = { test: 'Hello world!' }
    await worker.publish(data)
    //await worker.disconnect()
})();