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

  client.socket.transmit = async function (topic, status, message, eventID) {

    let event = {
      topic: topic
    }
    eventID = (eventID === undefined) ? uuidV1() : eventID

    if (status === 'initial' && typeof (message) == "object") {
      message.eventID = eventID
      if (topic == 'publish') {
        event.resolvePromise = message.resolvePromise
        delete message.resolvePromise
      }
      event.message = format.output(topic, message)
    } else {
      if (topic == 'publish') {
        event.resolvePromise = message.resolvePromise
        delete message.resolvePromise
      }
      event.message = message.message
    }

    if (client.socket.readyState == 1) {
      client.socket.send(event.message)
      client.pendingQueue[eventID] = event

      if (topic == 'publish') {
        if (!(await config.get('settings')).qualityOfService) {
          event.resolvePromise('noticed: ' + eventID)
        }
      }
    } else {
      client.unsentQueue[eventID] = event
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
          if ((await config.get('settings')).qualityOfService) {
            if (client.pendingQueue[fresponse.id] !== undefined) {
              client.pendingQueue[fresponse.id].resolvePromise("noticed: " + fresponse.id)
            } else {
              client.unsentQueue[fresponse.id].resolvePromise("noticed: " + fresponse.id)
            }
          }
        }
        delete client.pendingQueue[fresponse.id]
        delete client.unsentQueue[fresponse.id]
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
    debug('trigger initiated')
    status.report(fresponse.statusID, "Processing", "started", 'Service received job')
    client.trigger.execute(fresponse)
  } else if (fresponse.topic === 'pong') {
    isConnected = true
  } else if (fresponse.topic === 'change') {
    if(client.config.isCompared.resolve){
      clearTimeout(client.config.isCompared.timeout)
      client.config.isCompared.resolve(fresponse.message)
    }
  } else if (fresponse.topic === 'compare') {
    console.log(fresponse.topic)
  } else if (fresponse.topic === 'update') {
    console.log(fresponse.topic)
  } else if (fresponse.topic === 'update-status') {
    if(client.config.isUpdated.resolve){
      clearTimeout(client.config.isUpdated.timeout)
      client.config.isUpdated.resolve(fresponse.message)
    }
  } else {
    debug('Unknown message topic received: ' + fresponse.topic)
  }
}

client.processQueue = function () {
  if (Object.keys(client.unsentQueue).length > 0) {
    while (client.socket.readyState == 1 && Object.keys(client.unsentQueue).length > 0) {
      debug((Object.keys(client.unsentQueue).length > 1 ? 'There are ' + Object.keys(client.unsentQueue).length + ' unsent messages. Processing...' : 'There is 1 unsent message. Processing...'))
      let eventID = Object.keys(client.unsentQueue)[0]
      let message = client.unsentQueue[eventID]
      client.socket.transmit(message.topic, 'queued', message, eventID)
      delete client.unsentQueue[eventID]
    }
    if (Object.keys(client.unsentQueue).length == 0) {
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
        resolve(true)
        clearInterval(interval)
      } else if (counter > 1000) {
        reject(false)
        clearInterval(interval)
      } else {
        client.socket.send(format.output('ping', {}))
      }
      counter++
    }, 300)
  })
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
