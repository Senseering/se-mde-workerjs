const axios = require('axios').default;
const cheerio = require('cheerio')

const url = "https://www.rki.de/DE/Content/InfAZ/N/Neuartiges_Coronavirus/Fallzahlen.html";
let Worker = require('../../src/worker')
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))
let config = './config/development.json'
let worker = new Worker(config);
let update = "";


    (async () => {
        do {
            let rkiWebsite = await axios.get(url)
            let $ = cheerio.load(rkiWebsite.data)
            let lines = []
            for (let i = 2; i < 18; i++) {
                lines.push(readLine($('tr')[i].children))
            }
            lines.push(readLineGesamt($('tr')[18].children))
            let table = lines.map(line => formatToNumber(line))
            table[16][0] = "Deutschland"
            let data = {}
            table.forEach((el) => {
                data[el[0]] = {
                    "confirmed": el[1],
                    "diffYesterday": el[2],
                    "casesPer100k": el[3],
                    "deaths": el[4],
                }
            })

            if (update !== JSON.stringify(data)) {
                update = JSON.stringify(data)
                await worker.connect()
                await worker.publish({ data: data, price: 0 })
                await worker.disconnect()
            }
            await sleep(1000 * 60 * 30)
        } while (true);
    })()




function readLine(line) {
    let array = []
    line.forEach((el) => array.push(el.children[0].data))
    return array
}


function readLineGesamt(line) {
    let array = []
    line.forEach((el) => array.push((el.children[0].children[0].data)))
    return array
}

function formatToNumber(array) {
    return array.map((el, i) => i > 0 ? Number.parseInt(el.replace(/\./g, "")) : el)
}