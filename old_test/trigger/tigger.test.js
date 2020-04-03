const expect = require('chai').expect
const mockery = require('mockery')
const message = require('./trigger.test.message')
const pullResponse = require('../http/input.test.pull.response')
const nock = require('nock')

describe('Push messages types', () => {
    before(() => {
        mockery.registerMock('mqtt', {
            connect : function (connection) {
                return {
                    on : function(bla, bla){
                        return true
                    },
                    subscribe : function(bla, bla){
                        return true
                    }
                }
            }
        })
        mockery.registerMock('../http/output', {
            send : function (edge, data) {
                return 'a6edc906-2f9f-5fb2-a373-efac406f0ef2'
            }
        })
        mockery.registerMock('../utils/verify', {
            appendSignature : function () {
                return true
            }
        })
        mockery.enable({
            warnOnReplace: true,
            warnOnUnregistered: false,
            useCleanCache: true
        })
    })
    beforeEach(() => {
        nock('http://127.0.0.1:3000')
          .get('/worker/pull?id=507f1f77bcf86cd799439011')
          .reply(200, pullResponse)
          .get('/worker/pull?id=507f1f77bcf86cd799439012')
          .reply(200, pullResponse)
    })
    it('incorrect push message', () => {
        let Trigger = require('../../lib/trigger/trigger')
        let t = new Trigger({
            name: 'hello_world',
            location: {
                lat: 50.7797268,
                long: 6.100391
            },
            input: '../test/worker.test.input.js',
            output: '../test/worker.test.output.js',
            apiKey: '123466',
            privKey: './env/key_world.pem',
            mode: 0, // Can the worker be triggerd from the outside or only from the inside
            run: (data, args) => {
                return 'Hello World'
            }
        },'127.0.0.1')
        t.setID('a6edc906-2f9f-5fb2-a373-efac406f0ef2')
        return t.prepare('hello').then(function(result){
            expect(result).to.be.false
        })
    })

    it('correct push message', () => {
        let Trigger = require('../../lib/trigger/trigger')
        let t = new Trigger({
            name: 'hello_world',
            location: {
                lat: 50.7797268,
                long: 6.100391
            },
            input: '../test/worker.test.input.js',
            output: '../test/worker.test.output.js',
            apiKey: '123466',
            port: 443,
            privKey: './env/key_world.pem',
            mode: 0, // Can the worker be triggerd from the outside or only from the inside
            run: (data, args) => {
                return 'Hello World'
            }
        },'127.0.0.1')
        t.setID('a6edc906-2f9f-5fb2-a373-efac406f0ef2')
        return t.prepare(JSON.stringify(message)).then(function(result){
            expect(result).to.be.true
        })
    })

    after(() => {
        mockery.deregisterAll()
        mockery.disable()
    })
})
