let Worker = require('../../src/worker')

let config = './config/development.json'

let worker = new Worker(config);

let exampleJson = require("./data/4kb.json");

(async function () {
    await worker.connect()
    let counter = 0
    while (true) {
        await worker.publish({ test: exampleJson })
        counter++       
    }
    await worker.disconnect()
})();