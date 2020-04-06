const debug = require('debug')('ws:client')
const WebSocket = require('ws');
const update = require("./events/update")
const config = require("nconf")
const fs = require("fs")
let status
//const status = require("../socket/status")
let isRegistered = false
require('colors')
let format = require("../utils/formatMessages")


let client = {}
let sendQueue = []


let triggerCallback = undefined
client.triggerCallback = function (workerCallback) {
  triggerCallback = workerCallback
}

client.init = async (apiDomain, port, id, apikey) => {
  client.socket = new WebSocket(
    (config.get('protocol') === 'https' ? 'wss' : 'ws') + '://'
    + id + ':'
    + apikey + '@'
    + apiDomain + ":"
    + port + "/connector/"
  )

  client.socket.on('open', function () {
    debug("Connection to manager established")
  })

  status = require("./status")
  return client.socket
}

client.handleMessage = async function (fresponse, Trigger) {
  if (fresponse.topic === "response") {
    try {
      fresponse = fresponse.message
      if (fresponse.code === 204) {
        delete fresponse.id
        debug("Workersettings differ from settings in Manager. Overwriting: " + fresponse.msg)
      } else {
        if (fresponse.code === 200 && fresponse.event === "register") { isRegistered = true }
        if (fresponse.code === 200 && fresponse.event === "send" && fresponse.id !== undefined) {
          sendQueue[fresponse.id]("noticed: " + fresponse.id)
        }
        debug('(Code ' + fresponse.code + ') ' + (fresponse.code == 200 ? 'Successful' : 'Error') + ' response from "' + fresponse.event + '": ' + fresponse.msg)
      }
    } catch (err) {
      debug(("error in respone" + err).red)
    }
  }

  if (fresponse.topic === "update") {
    delete fresponse.topic
    await update(fresponse.message)
  }

  if (fresponse.topic === "trigger") {
    message = fresponse.message
    debug('trigger initiated' + JSON.stringify(message))
    status.report(message.statusID, "Processing", "started", 'Service received job')
    Trigger.prepare(message)
  }
}

client.isConnected = async function () {
  return new Promise(function (resolve, reject) {
    let counter = 1
    let interval = setInterval(function () {
      if (client.readyState !== 1) {
        resolve(true)
        clearInterval(interval)
      } else if (counter > 1000) {
        reject(false)
        clearInterval(interval)
      } else {
        debug("Waiting for connection to manager")
      }
      counter++
    }, 2000)
  })
}

client.isRegistered = async function () {
  return new Promise(function (resolve, reject) {
    let counter = 1
    let interval = setInterval(function () {
      if (isRegistered) {
        resolve(true)
        clearInterval(interval)
      } else if (counter > 1000) {
        reject(false)
        clearInterval(interval)
      } else {
        debug("Waiting for registration, attempt " + counter)
      }
      counter++
    }, 300)
  })
}

client.succsessfullySend = async function (data_id, resolve) {
  sendQueue[data_id] = resolve
}
module.exports = client
