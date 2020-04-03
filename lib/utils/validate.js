const Ajv = require('ajv')
//const debug = require('debug')('validate')

let validate = {}

/**
 * Validate the data with the template
 * @param {event} event 
 * @param {template to be validated} template 
 */
validate.validateData = function (event, template) {
    let ajv = new Ajv() 
    let validate = ajv.compile(template)
    let valid = validate(event)
    let array = [valid, validate]
    return array
}


module.exports = validate
