const init = require('../socket/methods/state/init')
const change = require('../socket/methods/state/change')
const client = require('../socket/client')
const object = require('lodash/object');
const minimatch = require('minimatch')
const Ajv = require('ajv')
let ajv = new Ajv()

let state = {}
state.store = {}
state.store.schema = {}
state.event = {}


/**
 * This initalises the state with a schema and a current optional state
 * @param {Object} schema The json schema that validates the state and is used in the frontend functionality
 * @param {Object} initalState The inital state that corresponds to the schema ( optional )
 */
state.init = async function (schema, initalState) {
    // Check schema against intialState
    state.store.schema.validate = ajv.compile(schema)
    let valid = state.store.schema.validate(initalState)
    if (!valid)
        throw new Error(validate.errors[0].dataPath + " " + validate.errors[0].message)
    // Store state locally
    state.store.state = initalState
    state.store.schema.raw = schema
    // Intialise state on Manager
    await init.send({
        schema,
        initalState
    })
    // Open up functionality
    state.set = async function (key, value) {
        // Set state locally
        object.set(state.store.state, key, value)
        // Set state in remote 
        await change.send({
            key,
            value
        })
    }

    state.get = function (key) {
        // Return state value
        return object.get(state.store.state, key)
    }

    /**
     * Adds a event listner 
     * @param {String} event "change" event for value change
     * @param {GlobPattern} pattern Pattern according to https://www.npmjs.com/package/minimatch
     * @param {Function} cb 
     */
    state.on = function (event, pattern, cb) {
        if(event === 'change'){
            // Subscribe to topic for incoming events for the given key
            if(!state.event['change'])
                state.event['change'] = {}

            state.event['change'][pattern] = cb
        }
    }

    
    // Register event in Websocket
    client.state.event.change = async (key, value) => {
        let stateCopy = JSON.parse(JSON.stringify(state.store.state))
        object.set(stateCopy, key, value)
        let valid = state.store.schema.validate(stateCopy)
        if (!valid) {
            debug('Incoming malformed state:', validate.errors)
        } else {
            await state.set(key, value)
            if(state.event['change']){
                for (const [pattern, cb] of Object.entries(state.event['change'])) {
                    if(minimatch(key, pattern))
                        cb(key, value)
                }
            }
        }
    }
}

module.exports = state
