const expect = require('chai').expect

const mockery = require('mockery')


describe('Testing the the run function', () => {
    beforeEach(() => {
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
        mockery.registerMock('./utils/fsutil', {
            ensureDirectoryExistence : function (id) {

            }
        })   
        mockery.registerMock('./http/register', {
            submit : function (url, registration) {
                return 'a6edc906-2f9f-5fb2-a373-efac406f0ef2'
            }
        })
        mockery.registerMock('../http/output', {
            send : function (url, registration) {
                return true
            }
        })
        mockery.registerMock('node-persist', {
            getItem : function (id) {
                return undefined
            },setItem : function (id, key) {
            }, init : function () {
            }
        })
        mockery.registerMock('fs', {
            existsSync : function (id) {
                return true
            },readFileSync : function (path) {
                return require('./worker.test.key')
            }, writeFileSync : function () {
            }
        })
        mockery.registerMock('require-from-string', 
            function (inp){
                return inp
            }
        )
        mockery.enable({
            warnOnReplace: true,
            warnOnUnregistered: false,
            useCleanCache: true
        })
    })


    it('Check for result of hello world', (done) => {
        let Component = require('../lib/worker')
        config = {
            id: '45aa10bf-e185-5102-bff2-e50932bdea8f',
            name: 'hello_world',
            location: {
                lat: 50.7797268,
                long: 6.100391
            },
            input: '../test/worker.test.input.js',
            output: '../test/worker.test.output.js',
            apiKey: '123466',
            privKey: './worker.test.key.js',
            mode: 0, // Can the worker be triggerd from the outside or only from the inside 
            run: (data, args) => { 
                return 'Hello World'
            }
        }
        c1 = new Component(config,'127.0.0.1')

        c1.init().then(() => {
            c1.run().then(function (res){
                if(res.data === 'Hello World'){
                    done()
                }else{
                    done('Failed with result: ' + res)
                }
            }).catch((e) => {
                done('Unexpected Error: ' + e)
            })
        })

    })

    afterEach(() => {
        mockery.deregisterAll()
        mockery.disable()
    })
})