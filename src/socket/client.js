const WebSocket = require('ws')
const config = require('../utils/config/config')
const uuidV1 = require('uuid').v1
const debug = require('debug')('ws:client')
require('colors')

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

  client.socket.transmit = async function ({ topic, message, eventID, resolvePromise }) {
    eventID = (eventID === undefined) ? uuidV1() : eventID
    message.eventID

    if (client.socket.readyState == 1) {
      client.socket.send(format.output(topic, message))
      client.pendingQueue[eventID] = resolvePromise

      if (topic == 'data') {
        if (!(await config.get('settings')).qualityOfService) {
          resolvePromise('noticed: ' + eventID)
        }
      }
    } else {
      client.unsentQueue[eventID] = { topic, message }
    }
  }

  client.socket.onmessage = function (msg) {
    client.handleMessage(format.input(msg.data))
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

client.handleMessage = async function (response) {
  let topic = response.topic
  let message = response.message

  if (topic === "response") {
    try {
      if (message.code === 204) {
        delete fresponse.topic
        debug("Workersettings differ from settings in Manager. Overwriting: " + message.msg)
      } else {
        if (message.code === 200 && message.event === "register") {
          isRegistered = true
        }
        if (message.code === 200 && message.event === "publish" && message.id !== undefined) {
          if ((await config.get('settings')).qualityOfService) {
            if (client.pendingQueue[message.id] !== undefined) {
              client.pendingQueue[message.id]("noticed: " + message.id)
            }
          }
        }
        delete client.pendingQueue[message.id]
        delete client.unsentQueue[message.id]
        debug('(Code ' + message.code + ') ' + (message.code == 200 ? 'Successful' : 'Error') + ' response from "' + message.event + '": ' + message.msg)
        if (message.code !== 200) {
          throw new Error('(Code ' + message.code + ') Error response from "' + message.event + '": ' + message.msg)
        }
      }
    } catch (err) {
      throw err
    }
  } else if (topic === "update") {
    if (client.config.isChanged.resolve) {
      clearTimeout(client.config.isChanged.timeout)
      client.config.isChanged.resolve(message)
    }
  } else if (topic === "trigger" && client.hasOwnProperty('trigger')) {
    debug('trigger initiated')
    status.report(message.statusID, "Processing", "started", 'Service received job')
    client.trigger.execute(message)
  } else if (topic === 'pong') {
    isConnected = true
  } else if (topic === 'change') {
    if (client.config.isCompared.resolve) {
      clearTimeout(client.config.isCompared.timeout)
      client.config.isCompared.resolve(message)
    }
  }
  else if (topic === 'worker') {
    console.log(topic)
  }
  else if (topic === 'compare') {
    console.log(topic)
  } else if (topic === 'update-status') {
    if (!message.remote) {
      // Returns the status of the update process and resolves it
      if (client.config.isUpdated.resolve) {
        clearTimeout(client.config.isUpdated.timeout)
        if (!message.error) {
          client.config.isUpdated.resolve(message)
        } else {
          client.config.isUpdated.reject(new Error(message.error))
        }
      }
    } else {
      // Triggers a new update process becuase it was initialized from remote
      await client.onUpdate()
    }
  } else {
    debug('Unknown message topic received: ' + topic)
  }
}

client.processQueue = function () {
  if (Object.keys(client.unsentQueue).length > 0) {
    while (client.socket.readyState == 1 && Object.keys(client.unsentQueue).length > 0) {
      debug((Object.keys(client.unsentQueue).length > 1 ? 'There are ' + Object.keys(client.unsentQueue).length + ' unsent messages. Processing...' : 'There is 1 unsent message. Processing...'))
      let eventID = Object.keys(client.unsentQueue)[0]
      let unsendMessage = client.unsentQueue[eventID]
      client.socket.transmit({ topic: unsendMessage.topic, message: unsendMessage.message, eventID })//message.topic, 'queued', message, eventID)
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

client.state = {}
client.state.isChanged = {}

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
