const WebSocket = require('ws');
const config = require("nconf")
//const fs = require("fs")
const debug = require('debug')('ws:client')
require('colors')

const update = require("./events/update")
let format = require("../utils/formatMessages")
//const status = require("../socket/status")

let status
let isRegistered = false



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

  client.socket.on('message', (msg) => {
    client.handleMessage(format.input(msg))
  })

  status = require("./status")
  return client.socket
}

client.handleMessage = async function (fresponse) {
  if (fresponse.topic === "response") {
    try {
      fresponse = fresponse.message
      if (fresponse.code === 204) {
        delete fresponse.id
        debug("Workersettings differ from settings in Manager. Overwriting: " + fresponse.msg)
      } else {
        if (fresponse.code === 200 && fresponse.event === "register") { isRegistered = true }
        if (fresponse.code === 200 && fresponse.event === "publish" && fresponse.id !== undefined) {
          sendQueue[fresponse.id]("noticed: " + fresponse.id)
        }
        debug('(Code ' + fresponse.code + ') ' + (fresponse.code == 200 ? 'Successful' : 'Error') + ' response from "' + fresponse.event + '": ' + fresponse.msg)
      }
    } catch (err) {
      debug(("error in response" + err).red)
    }
  }

  if (fresponse.topic === "update") {
    delete fresponse.topic
    await update(fresponse.message)
  }
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

client.isConnected = async function () {
  debug('Waiting for connection to manager...')
  return new Promise(function (resolve, reject) {
    let counter = 1
    let interval = setInterval(function () {
      if (client.socket.readyState == 1) {
        resolve(true)
        clearInterval(interval)
      } else if (counter > 1000) {
        reject(false)
        clearInterval(interval)
      }
      counter++
    }, 300)
  })
}

client.succsessfullySend = async function (data_id, resolve) {
  sendQueue[data_id] = resolve
}

module.exports = client
