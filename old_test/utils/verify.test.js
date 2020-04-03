const verify = require('../../lib/utils/verify')
const assert = require('assert')
const expect = require('chai').expect
const fs = require('fs')
let testcases

describe('serializeData', () => {
  before(function (done) {
    fs.readFile('test/utils/verify.test.data.json', function read (err, data) {
      if (err) {
        console.log('You shouldnt be here')
        throw err
      }
      testcases = JSON.parse(data)
      done()
    })
  })

  it('Multiple tests from file', () => {
      testcases.forEach(element => {
        let serializedObject = verify.serializeObj(element.input, '')
        expect(serializedObject[1]).to.eql(element.output)
      })
  }) 
})
