const WebSocket = require('reconnecting-websocket')
const ws = require('ws')
const config = require("nconf")
const debug = require('debug')('ws:client')
require('colors')

const update = require("./events/update")
let format = require("../utils/formatMessages")

let status
let isRegistered = false



let client = {}
client.waitingQueue = []
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
    + port + "/connector/",
    [],
    { WebSocket: ws, connectionTimeout: 2000 }
  )

  client.socket.emit = function (message) {
    if (client.socket.readyState == 1) {
      client.socket.send(message)
    } else {
      client.waitingQueue.push(message)
    }
  }

  client.socket.onopen = function () {
    debug("Connection to manager established")
    setTimeout(client.processQueue, 1000)
  }

  client.socket.onmessage = function (msg) {
    client.handleMessage(format.input(msg))
  }

  client.socket.onclose = function () {
    isRegistered = false
    debug('Unable to connect to manager. Trying to connect...')
  }

  status = require("./events/status")
  return client.socket
}

client.handleMessage = async function (fresponse) {
  fresponse = JSON.parse(fresponse.message.data, 'utf8')
  if (fresponse.topic === "response") {
    try {
      if (fresponse.code === 204) {
        delete fresponse.topic
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
  } else if (fresponse.topic === "update") {
    delete fresponse.topic
    delete fresponse.id
    await update(fresponse)
  } else if (fresponse.topic === "trigger" && client.hasOwnProperty('trigger')) {
    message = fresponse.message
    debug('trigger initiated :' + JSON.stringify(message))
    status.report(message.statusID, "Processing", "started", 'Service received job')
    client.trigger.execute(message)
  } else {
    debug('Unknown message topic received: ' + fresponse.topic)
  }
}

client.processQueue = function () {
  if (client.waitingQueue.length > 0) {
    while (client.socket.readyState == 1 && client.waitingQueue.length > 0) {
      debug((client.waitingQueue.length > 1 ? 'There are ' + client.waitingQueue.length + ' unsent messages. Processing...' : 'There is 1 unsent message. Processing...'))
      let message = client.waitingQueue[0]
      client.socket.send(message)
      client.waitingQueue.shift()
    }
    if (client.waitingQueue.length == 0) {
      debug('All unsent messages sent')
    }
  } else {
    debug('No leftover messages to be send')
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

/*setInterval(function () {
  if (client.hasOwnProperty('waitingQueue')) {
    debug(client.waitingQueue)
  }
}, 5000)*/

module.exports = client
