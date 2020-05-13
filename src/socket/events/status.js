const debug = require('debug')('socket:status')
require('colors')

let client = require('../client')
let format = require("../../utils/formatMessages")

let status = {}

status.report = async function (statusID, step, status, msg = "", code = null) {
  try {
    let toPublishMsg = {
      statusID: statusID,
      timestamp: Date.now(),
      status: status,
      step: step,
      msg: msg,
      code: code
    }

    await client.socket.transmit('log', 'initial', toPublishMsg)
  } catch (err) {
    debug(("error occured on reporting worker status:" + err).red)
    throw err
  }
}

module.exports = status
