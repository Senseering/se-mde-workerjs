let Worker = require('../../src/worker')

let config = './config.json'

let worker = new Worker();

let exampleJson = require("./data/4kb.json");

(async function () {
    await worker.connect(config)
    let counter = 0
    let start = Date.now()
    let intervall = 30//seconds

    while (true) {
        await worker.publish({ test: exampleJson })
        counter++

        if (Date.now() - start > intervall * 1000) {
            console.log("datapieces (absolut):\t" + counter + "\t per second:\t" + counter / intervall + " \t \t KB/s: \t" + (counter * 4) / intervall)
            counter = 0
            start = Date.now()
        }
    }
    await worker.disconnect()
})();