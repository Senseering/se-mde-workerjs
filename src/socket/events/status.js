const debug = require('debug')('socket:status')
require('colors')

let socket = require('../client').socket
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
    socket.send(format.output("log", toPublishMsg))
  } catch (err) {
    debug(("error occured on publishing worker status:" + err).red)
    throw err
  }
}
module.exports = status
