const config = require('nconf')
const fs = require('fs')
const uuidV1 = require('uuid/v1')
const debug = require('debug')('socket:publish')
require("colors")

let client = require('../client')
const validate = require('../../utils/validate')
const verify = require('../../utils/verify')
const format = require("../../utils/formatMessages")

/**
 * Publishes the output data on the manager
 * @param {Object} data The actual data package that should be published
 */
let publish = async function (data, meta, statusID, key, resolve) {
    try {
        //check data against output schema of worker if required
        if (config.get('schema').check) {
            let outputSchema = JSON.parse(fs.readFileSync(config.get('schema').output, "utf8"))

            let valid = validate.validateData(data, outputSchema)
            if (valid[0]) {

                let package = {
                    data: {
                        data,
                        meta
                    }
                }

                if (config.get('signature')) {
                    verify.appendSignature(package.data, key)
                } else {
                    package.data.signature = '' //Workaround for manager websocket: request requires 'signature' field atm
                }

                package.data._id = uuidV1()
                package.statusID = statusID

                //publish data
                client.succsessfullySend(package.data._id, resolve)

                /*if (client.socket.readyState == 1) {
                    client.socket.send(format.output('send', package))
                } else {
                    client.waitingQueue.push(format.output('send', package))
                }*/
                client.socket.emit(format.output('send', package))
                return { data: package.data, id: package._id }

            } else {
                debug('data package does not match the output schema. Data package will not be published.')
                //client.socket.send(format.output('send', { id: package.data._id })) TODO: send as log to manager
                return false
            }
        }
    } catch (error) {
        debug(error.message.red)
    }
}

module.exports = publish
