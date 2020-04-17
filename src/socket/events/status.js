const debug = require('debug')('socket:status')
require('colors')

let client = require('../client')
let format = require("../../utils/formatMessages")

let status = {}

status.report = function (id, step, status, msg = "", code = null) {
  try {
    let toPublishMsg = {
      statusID: id,
      timestamp: Date.now(),
      status: status,
      step: step,
      msg: msg,
      code: code
    }
    client.socket.emit('log', toPublishMsg)
  } catch (err) {
    debug(("error occured on reporting worker status:" + err).red)
    throw err
  }
}

module.exports = status
