const expect = require('chai').expect
const nock = require('nock')

const output = require('../../lib/http/output')
const data = require('./output.test.response')

describe('Output Tests', () => {
    before(() => {
        nock('http://127.0.0.1')
          .post('/worker/send', data)
          .reply(200, {id: '123', counter: '321'})
          .post('/worker/send', data)
          .reply(400, {err: 'Template doesnt match data structure'})
          .post('/worker/send', data)
          .reply(401, {err: 'Signature doesnt match data'})
    })

    it('Sends correct package', () => {
        return output.send('127.0.0.1', data).then((result) => {
            expect(result).to.be.true
          })
    })

    it('Throws an error because the signature doesnt match the data', () => {
      return output.send('127.0.0.1', data).then((result) => {
      }).catch((e) => {
        expect(e.response.status).to.equal(400)
      })
    })

    it('Throws an error because the template doesnt match the data', () => {
      return output.send('127.0.0.1', data).then((result) => {
      }).catch((e) => {
        expect(e.response.status).to.equal(401)
      })
    })
})