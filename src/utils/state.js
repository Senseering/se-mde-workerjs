const Ajv = require('ajv')
let ajv = new Ajv() 

let state = {}
state.store = {}

/**
 * This initalises the state with a schema and a current optional state
 * @param {Object} schema The json schema that validates the state and is used in the frontend functionality
 * @param {Object} initalState The inital state that corresponds to the schema ( optional )
 */
state.init = async function (schema, initalState) {
    // Check schema against intialState
    let validate = ajv.compile(schema)
    let valid = validate(initalState)
    if (!valid)
        throw new Error(validate.errors[0].dataPath + " " + validate.errors[0].message)
    // Store state locally
    state.store.schema = schema
    state.store.state = state
    // Intialise state on Manager
    
    // Open up functionality
    state.set = async function (key, value) {
        // Set state locally

        // Set state in remote 
    }

    state.get = async function (key) {
        // Return state value

    }

    state.on = async function (event, key, cb) {
        // Subscribe to topic for incoming events for the given key

        // Call cb with correct value
    }
}

module.exports = state