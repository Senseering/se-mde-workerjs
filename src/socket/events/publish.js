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
let publish = async function (package, { statusID = undefined, key, resolvePromise, ttl = undefined } = {}) {
    try {
    
        verify.appendSignature(package, key)

         //append non signature relevant information here
        package._id = uuidV1()
        package.statusID = statusID
        if (ttl) {
            package.meta.ttl = ttl
        }

        //publish data
        client.succsessfullySend(package._id, resolvePromise)
        client.socket.transmit('publish', 'unsent', package)
        return { data: package.data, id: package._id }
    } catch (error) {
        debug(error.message.red)
    }
}

module.exports = publish
