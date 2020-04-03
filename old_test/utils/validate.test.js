const chai = require('chai')
const validateData = require('../../lib/utils/validate').validateData
const schema = require('./validate.test.schema')
const fs = require('fs')

var event
var array
var jsevent

describe('validateData', () => {
  before(function (done) {
    fs.readFile('test/utils/validate.test.data.json', function read (err, data) {
      if (err) {
        console.log('You shouldnt be here')
        throw err
      }
      event = data
      done()
    })
  })

  it('Should return valid', () => {
    jsevent = JSON.parse(event)
    array = validateData(jsevent, schema)
    chai.assert.equal(true, array[0])
  })
  it('Should not return valid if id field is missing', () => {
    jsevent = JSON.parse(event)
    delete jsevent.id
    array = validateData(jsevent, schema)
    chai.assert.equal(false, array[0])
  })
  it('Should not return valid if location field is missing', () => {
    jsevent = JSON.parse(event)
    delete jsevent.location
    array = validateData(jsevent, schema)
    chai.assert.equal(false, array[0])
  })
  it('Should not return valid if machine_timestamp field is missing', () => {
    jsevent = JSON.parse(event)
    delete jsevent.machine_timestamp
    array = validateData(jsevent, schema)
    chai.assert.equal(false, array[0])
  })
  it('Should not return valid if machine_id field is missing', () => {
    jsevent = JSON.parse(event)
    delete jsevent.machine_id
    array = validateData(jsevent, schema)
    chai.assert.equal(false, array[0])
  })
  it('Should not return valid if machine field is missing', () => {
    jsevent = JSON.parse(event)
    delete jsevent.machine
    array = validateData(jsevent, schema)
    chai.assert.equal(false, array[0])
  })
  it('Should not return valid if price price is missing', () => {
    jsevent = JSON.parse(event)
    delete jsevent.price
    array = validateData(jsevent, schema)
    chai.assert.equal(false, array[0])
  })
  it('Should not return valid if price signature is missing', () => {
    jsevent = JSON.parse(event)
    delete jsevent.signature
    array = validateData(jsevent, schema)
    chai.assert.equal(false, array[0])
  })

  it('Should not return valid if id is not 36 characters long', () => {
    jsevent = JSON.parse(event)
    jsevent.id = 'abc'
    array = validateData(jsevent, schema)
    chai.assert.equal(false, array[0])
  })
  it('Should not return valid if punch_force is nan', () => {
    jsevent = JSON.parse(event)
    jsevent.data.punch_force = ''
    array = validateData(jsevent, schema)
    chai.assert.equal(false, array[0])
  })
  it('Should not return valid if punch_stroke is nan', () => {
    jsevent = JSON.parse(event)
    jsevent.data.punch_stroke = ''
    array = validateData(jsevent, schema)
    chai.assert.equal(false, array[0])
  })
  it('Should not return valid if die_roll is nan', () => {
    jsevent = JSON.parse(event)
    jsevent.data.die_roll = ''
    array = validateData(jsevent, schema)
    chai.assert.equal(false, array[0])
  })
  it('Should not return valid if timestamp is nan', () => {
    jsevent = JSON.parse(event)
    jsevent.machine_timestamp = ''
    array = validateData(jsevent, schema)
    chai.assert.equal(false, array[0])
  })
  it('Should not return valid if there is a void object', () => {
    jsevent = JSON.parse('{}')
    array = validateData(jsevent, schema)
    chai.assert.equal(false, array[0])
  })
})
