let Worker = require('../../index')
let net = require('net')
const split = require("split")


let config = './config.json'

let worker = new Worker()
var parseStream = split("\n");

(async function () {
    await worker.connect(config)
    let server = net.createServer(function (socket) {


        socket.on('data', async (data) => {
            parseStream.write(data);
        });

        parseStream.on('data', async function (obj) {
            try {
                let msg = JSON.parse(obj.replace(/'/g, "\""))
                console.log(Object.keys(msg))

                await worker.publish({
                    'pos': msg.pos,
                    'FFT': msg.FFT,
                    'max_amp_rechts': msg.max_amp_rechts,
                    'max_amp_links': msg.max_amp_links,
                    'stdDev_rechts': msg.stdDev_rechts,
                    'stdDev_links': msg.stdDev_links,
                    'skew_rechts': msg.skew_rechts,
                    'skew_links': msg.skew_links,
                    'kurtosis_rechts': msg.kurtosis_rechts,
                    'kurtosis_links': msg.kurtosis_links,
                    'AE_rechts': msg.AE_rechts,
                    'AE_rinks': msg.AE_rinks
                })
            } catch (err) {
                console.log("error on parsing")
            }
        })
    })

    server.listen(1337, '127.0.0.1');
})();

