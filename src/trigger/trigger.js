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

        if (this.id === msg.serviceID) {
            debug('Running service function with foreign data...')

            let dataIDs = typeof (msg.workerIDs)[0] == 'string' ? [msg.data.map(a => a._id)] : msg.data.map(a => a._id)
            let workerIDs = typeof (msg.workerIDs) == 'string' ? [msg.workerIDs] : msg.workerIDs

            try {
                let calculations = await this.service(msg.data, function (message) { await status.report(statusID, 'Processing', 'log', message) })

                let data = calculations
                let options = {}
                if (typeof (calculations) == 'object' && Object.keys(calculations).every(a => ['data', 'price'].includes(a))) {
                    data = calculations.data
                    options = calculations.options === undefined ? {} : calculations.options
                }

                let meta = {
                    worker_id: this.id,
                    created_at: Date.now(),
                    price: options.price === undefined ? 0 : options.price,
                    location: (await config.get('profile')).location,
                    basedOn:
                    {
                        workerIDs,
                        dataIDs
                    }
                }

                if (data === undefined) {
                    throw new Error("service function has to return either a data object or an Object with data field and optionally an options object")
                }

                let receivePromise = new Promise(async (resolve, reject) => {
                    try {
                        await publish({ meta, data }, { statusID: statusID, key: this.key, resolvePromise: resolve })
                    } catch (err) {
                        reject(err)
                    }

                })
                await receivePromise

                await status.report(statusID, 'Processing', 'done', 'calculations done')
            }
            catch (error) {
                debug('Error during execution of service: ' + error)
                await status.report(statusID, 'Processing', 'error', error.message, 1)
            }
        } else {
            debug('Message not for this worker')
        }
    } catch (err) {
        debug('Error during pull or execution: ' + err)
        return false
    }
}

module.exports = Trigger
