const WebSocket = require('ws')
const config = require('../utils/config')
const uuidV1 = require('uuid/v1')
const debug = require('debug')('ws:client')
require('colors')

const update = require("./events/update")
let format = require("../utils/formatMessages")

let status
let isConnected = false
let isRegistered = false


let client = {}
client.unsentQueue = []
client.pendingQueue = []

let sendQueue = []

client.init = async () => {
  let fullConfig = await config.get("full")
  let url = new URL(fullConfig.url)
  client.socket = new WebSocket(
    (url.protocol === 'https:' ? 'wss' : 'ws') + '://'
    + fullConfig.credentials + '@'
    + url.host + "/connector/"
  )

  client.socket.onopen = async function () {
    await client.isConnected()
    debug("Connection to manager established")
    client.processQueue()
  }

  client.socket.transmit = function (topic, status, message) {
    let msg
    if (status === 'unsent' && typeof (message) == "object") {
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

  client.socket.onmessage = function (msg) {
    client.handleMessage(format.input(msg))
  }

  client.socket.onerror = function (err) {
    throw err
  }

  client.socket.onclose = function (event) {
    isConnected = false
    client.unsentQueue = client.unsentQueue.concat(client.pendingQueue)
    client.pendingQueue = []

    if (event.code != 1000) {
      setTimeout(async function () {
        debug('Connection to manager could not be established. Trying to connect...')
        await client.init()
      }, 1000)
    }
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
        }
        if (fresponse.code === 200 && fresponse.event === "publish" && fresponse.id !== undefined) {
          sendQueue[fresponse.id]("noticed: " + fresponse.id)
        }
        client.pendingQueue = client.pendingQueue.filter(a => a.eventID != fresponse.eventID)
        client.unsentQueue = client.unsentQueue.filter(a => a.eventID != fresponse.eventID)
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
    debug('trigger initiated :' + JSON.stringify(fresponse))
    status.report(fresponse.statusID, "Processing", "started", 'Service received job')
    client.trigger.execute(fresponse)
  } else if (fresponse.topic === 'pong') {
    isConnected = true
  } else if (fresponse.topic === 'change') {
    if(client.config.isCompared.resolve){
      client.config.isCompared.resolve(fresponse.message)
    }
  } else if (fresponse.topic === 'compare') {
    console.log(fresponse.topic)
  } else if (fresponse.topic === 'update') {
    console.log(fresponse.topic)
  } else {
    debug('Unknown message topic received: ' + fresponse.topic)
  }
}

client.processQueue = function () {
  if (client.unsentQueue.length > 0) {
    while (client.socket.readyState == 1 && client.unsentQueue.length > 0) {
      debug((client.unsentQueue.length > 1 ? 'There are ' + client.unsentQueue.length + ' unsent messages. Processing...' : 'There is 1 unsent message. Processing...'))
      let message = client.unsentQueue[0]
      client.socket.transmit(message.topic, 'queued', message)
      client.unsentQueue.shift()
    }
    if (client.unsentQueue.length == 0) {
      debug('All unsent messages sent')
    }
  } else {
    debug('No leftover messages to be send')
  }
}

client.config = {}
client.config.isCompared = {}
client.config.isChanged = {}
client.config.isUpdated = {}

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

client.isDisconnected = async function () {
  return new Promise(function (resolve, reject) {
    let counter = 1
    let interval = setInterval(function () {
      if (!isConnected) {
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

client.isConnected = async function () {
  return new Promise(function (resolve, reject) {
    let counter = 1
    let interval = setInterval(function () {
      if (isConnected) {
        client.pendingQueue = client.pendingQueue.filter(a => a.topic != 'ping')
        client.unsentQueue = client.unsentQueue.filter(a => a.topic != 'ping')
        resolve(true)
        clearInterval(interval)
      } else if (counter > 1000) {
        reject(false)
        clearInterval(interval)
      } else {
        client.socket.transmit('ping', 'unsent', {})
      }
      counter++
    }, 300)
  })
}

client.succsessfullySend = async function (data_id, resolve) {
  sendQueue[data_id] = resolve
}

client.disconnect = async function () {
  if (!isConnected) {
    debug('Disconnected already. Nothing to be done')
  } else {
    client.socket.close(1000)
    await client.isDisconnected()
    debug('Closed connection to manager')
  }
}

module.exports = client
