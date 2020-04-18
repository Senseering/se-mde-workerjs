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
        let package = {
            data: {
                data,
                meta
            }
        }

        verify.appendSignature(package.data, key)
        package.data._id = uuidV1()
        package.statusID = statusID

        //publish data
        client.succsessfullySend(package.data._id, resolve)
        client.socket.transmit('publish', package)
        return { data: package.data, id: package._id }
    } catch (error) {
        debug(error.message.red)
    }
}

module.exports = publish
