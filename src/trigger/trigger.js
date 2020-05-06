const config = require("../utils/config")
const debug = require('debug')('trigger')
require('colors')

const publish = require('../socket/events/publish')
const status = require('../socket/events/status')
let client = require('../socket/client')


/**
 * This function initalizes the trigger for the worker
 * @param {String} key The key of the worker to sign data
 * @param {String} service The function that will be run on trigger
 */
function Trigger(key, service) {
    (async () => {
        this.id = (await config.get('credentials')).split(":")[0]
        this.key = key
        this.service = service
        this.fixCost = (await config.get('payment')).fixCost
        this.isFixCostOnly = (await config.get('payment')).isFixCostOnly
        this.location = (await config.get('profile')).location
        this.name = (await config.get('profile')).name
        client.trigger = this
        debug("Trigger: " + this.name + " now available.")
    })()
}


/**
 * Preparing data for execution of service function
 * @param {String} msg String of the actual message received via websocket
 */
Trigger.prototype.execute = async function (msg) {
    try {
        debug('Preparing for execution')

        let statusID = msg.statusID
        delete msg.statusID

        if (this.id == msg.serviceID) {
            debug('Running service function with foreign data...')

            let dataIDs = msg.data.map(a => a._id)
            let workerIDs = msg.workerIDs

            let calculations = await this.service(msg.data, statusID)
            let meta = {
                id: this.id,
                timestamp: new Date().getTime(),
                price: calculations.price === undefined ? 0 : calculations.price,
                location:
                {
                    latitude: this.location.latitude,
                    longitude: this.location.longitude
                },
                basedOn:
                {
                    workerIDs,
                    dataIDs
                }
            }

            if (calculations.data === undefined) {
                throw new Error("service function has to return an Object with data field and optionally a price field")
            }

            let receivePromise = new Promise(async (resolve, reject) => {
                try {
                    await publish(calculations.data, meta, statusID, this.key, resolve)
                } catch (err) {
                    reject(err)
                }

            })
            await receivePromise

            status.report(statusID, "Processing", "done", 'calculations done')
        } else {
            debug('Message not for this worker')
        }
    } catch (err) {
        debug('Error during pull or execution: ' + err)
        return false
    }
}

module.exports = Trigger
