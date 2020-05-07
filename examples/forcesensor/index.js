let Worker = require('../../src/worker')
let fs = require('fs')


let config = './config/development.json'

let punchforce = new Worker(config);
const folder = '../../../data/data/'//data has to be placed in folder outside of this repo

const processCount = 2742
let allSensors = {}
let result = [];

(async function () {
    await punchforce.connect()


    fs.readdir(folder, async (err, files) => {
        console.log("loading files of sensor data")
        files.forEach(file => {
            allSensors[file.replace(".json", "")] = (JSON.parse(fs.readFileSync(folder + file)))

        })
        console.log("all Sensors loaded")
        for (let i = 0; i < processCount; i++) {
            Math.floor(i / processCount * 100) % 10 === 0 ? console.log("process: " + Math.floor(i / processCount * 100) + " finished") : ""
            result[i] = {}
            for (file of Object.keys(allSensors)) {

                let oneCol = allSensors[file.replace(".json", "")][i]
                let resArray = []
                for (key in Object.keys(oneCol)) {
                    resArray.push(oneCol[key])
                }
                result[i][file.replace(".json", "")] = resArray
                delete data
            }
            for (file of Object.keys(allSensors)) {
                delete allSensors[file.replace(".json", "")][i]
            }
        }
        console.log("successfully structured the data!")
        let start = Date.now()

        let i = 0
        while (i < processCount) {
            console.log("published DATA")
            let data = result[i]
            await punchforce.publish(data, { price: 0, ttl: 60 * 400 * 1000 })
            await sleep(60000)
            i++
            if (i + 1 >= processCount) {
                i = 0
                console.log("restart")
            }
        }
        let end = Date.now()
        console.log("it took: " + (end - start) / 1000 + " seconds to write " + processCount + " processes of each " + 10500 * 9 + " elements")
    })
})();

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}   