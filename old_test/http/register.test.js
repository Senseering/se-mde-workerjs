const expect = require('chai').expect
const nock = require('nock')
const mocha = require('mocha')

const register = require('../../lib/http/register')
//const data = require('./output.test.response')

describe('Registraion test', () => {
    before(() => {
        nock('http://127.0.0.1')
          .post('/worker/register', {
            some: 'stuff'
            })
          .reply(200, 'a6edc906-2f9f-5fb2-a373-efac406f0ef2')
    })

    it('New registration', (done) => {
        register.submit('127.0.0.1', {
            some: 'stuff'
        }).then((result) => {
            if(result === 'a6edc906-2f9f-5fb2-a373-efac406f0ef2'){
                done()
            }else{
                done('Wrong return: ' + result)
            }
        }).catch( (err) => {
            done('Error occuerd: ' + err)
        })
    })
})