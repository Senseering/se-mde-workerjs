const WebSocket = require('reconnecting-websocket')
const ws = require('ws')
const config = require("nconf")
const uuidV1 = require('uuid/v1')
const debug = require('debug')('ws:client')
require('colors')

const update = require("./events/update")
let format = require("../utils/formatMessages")

let status
let isRegistered = false


let client = {}
client.unsentQueue = []
client.pendingQueue = []
client.waitingQueue = []
let sendQueue = []

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

  client.socket.emit = function (topic, message) {
    let msg
    if (topic === 'queued') {
    }

  client.socket.transmit = function (topic, message) {
    let msg
    if (topic !== 'unsent' && typeof (message) == "object") {
      message.eventID = uuidV1()
      msg = format.output(topic, message)
    } else {
      msg = message.message
      delete msg.topic
    }

    if (client.socket.readyState == 1) {
      client.socket.send(msg)
      client.pendingQueue.push({ eventID: message.eventID, topic: topic, message: msg })
    } else {
      client.unsentQueue.push({ eventID: message.eventID, topic: topic, message: msg })
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
    client.unsentQueue = client.unsentQueue.concat(client.pendingQueue)
    client.pendingQueue = []
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
        if (fresponse.code === 200 && fresponse.event === "register") {
          isRegistered = true
          client.pendingQueue = client.pendingQueue.filter(a => a.eventID != fresponse.eventID)
        }
        if (fresponse.code === 200 && fresponse.event === "publish" && fresponse.id !== undefined) {
          client.pendingQueue = client.pendingQueue.filter(a => a.eventID != fresponse.eventID)
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
  if (client.unsentQueue.length > 0) {
    while (client.socket.readyState == 1 && client.unsentQueue.length > 0) {
      debug((client.unsentQueue.length > 1 ? 'There are ' + client.unsentQueue.length + ' unsent messages. Processing...' : 'There is 1 unsent message. Processing...'))
      let message = client.unsentQueue[0]
      client.socket.transmit('unsent', message)
      client.unsentQueue.shift()
    }
    if (client.unsentQueue.length == 0) {
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
        debug("Waiting for registration")
      }
      counter++
    }, 300)
  })
}

client.succsessfullySend = async function (data_id, resolve) {
  sendQueue[data_id] = resolve
}

client.disconnect = async function () {
  if (client.socket.readyState != 1) {
    debug('Disconnected already. Nothing to be done')
  } else {
    await client.socket.close()
    debug('Closed connection to manager')
  }
}

module.exports = client
