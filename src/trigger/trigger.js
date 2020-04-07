const uuidV1 = require('uuid/v1')
const config = require('config')
const debug = require('debug')('trigger')
require('colors')

const Ajv = require('ajv')
let ajv = new Ajv({ useDefaults: true })
let triggerSchema = ajv.compile(require('./schema/trigger'))

const validate = require('../utils/validate')
const output = require('../socket/events/output')
const verify = require('../utils/verify')
const status = require('../socket/status')
//const format = require("../utils/formatMessages")
//const handleMessage = require("../socket/client").handleMessage


/**
 * This function initalizes the mqtt stream and connects all workers
 * @param {String} run The function that will be run on trigger
 */
function Trigger(run, key) {
    this.key = key
    this.run = run
    this.fixCost = config.get('payment').fixCost
    this.isFixCostOnly = config.get('payment').isFixCostOnly
    this.edge = config.get('apiDomain')
    this.completeEdgeLink = config.get('apiDomain') + ':' + config.get('port')
    this.location = config.get('location')
    this.name = config.get('name')
    debug("Trigger: " + this.name + " now available.")
}


/**
 * Receives the push notification *only available with remote enabled*
 * @param {String} msg String of the actual message received via mqtt
 */
Trigger.prototype.prepare = async function (msg) {
    try {
        debug('Receiving remote trigger and preparing for execution')
        // Check if data matches the schema to avoid huge failure
        let invoke = msg
        let statusID = invoke.statusID
        delete invoke.statusID
        let valid = validate.validateData(invoke, triggerSchema)
        if (valid[0]) {
            let dataIDs = invoke.data.map(a => a._id)
            let workerIDs = invoke.workerIDs
            if (this.id == invoke.serviceID) {

                await this.exec(invoke, {
                    id: this.id,
                    timestamp: new Date().getTime(),
                    price: 0,
                    location:
                    {
                        latitude: this.location.latitude,
                        longitude: this.location.longitude,
                    },
                    basedOn:
                    {
                        workerIDs,
                        dataIDs
                    }
                }, statusID)
                status.report(statusID, "Processing", "done", 'calculations done')
                return true
            } else {
                debug('Message not for this worker')
            }

        } else {
            debug('Message is no valid trigger: ' + valid[0])
            return false
        }
    } catch (err) {
        debug('Error during pull or execution: ' + err)
        return false
    }
}

/**
 * Executes the function on the given input
 * @param {Object} input data package which should be processed by the function
 */
Trigger.prototype.exec = async function (input, meta, statusID) {
    debug('Executing workers function')
    let calculations = await this.run(input, meta)
    if (calculations.data === undefined) {
        throw new Error("run function has to return an Object with data field and optionally a price field")
    }
    let data = calculations.data

    //append additional prices if worker is not fixCostWorker 
    if (calculations.price !== undefined && !this.isFixCostOnly) {
        meta.price = calculations.price
    } else {
        delete meta.price
    }

    let result = {
        data,
        meta
    }
    verify.appendSignature(result, this.key)
    result._id = uuidV1()
    let receivePromise = new Promise(async (resolve, reject) => {
        try {
            await output.send({ data: result, statusID: statusID }, resolve)
        } catch (err) {
            reject(err)
        }

    })
    await receivePromise
    return { data: data, id: result._id }
}

module.exports = Trigger
