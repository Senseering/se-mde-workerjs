const expect = require('chai').expect

const mockery = require('mockery')
const mock = require('mock-fs');


describe('Testing the constructor of the worker', () => {
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
        mockery.enable({
            warnOnReplace: true,
            warnOnUnregistered: false
        })
    })

    it('Check if worker has a defined edge node', () => {
        let Component = require('../lib/worker')
        c1 = new Component({
            id: '45aa10bf-e185-5102-bff2-e50932bdea8f',
            name: 'hello_world',
            location: {
                lat: 50.7797268,
                long: 6.100391
            },
            input: './env/input_world.js',
            output: './env/output_world.js',
            apiKey: '123466',
            privKey: './env/key_world.pem',
            mode: 0, // Can the worker be triggerd from the outside or only from the inside 
            run: (data, args) => { 
                return 'Hello World'
            }
        },'127.0.0.1')

        expect(c1.edge).to.equal('127.0.0.1')
    })

    it('Check for the config object', () => {
        let Component = require('../lib/worker')
        config = {
            id: '45aa10bf-e185-5102-bff2-e50932bdea8f',
            name: 'hello_world',
            location: {
                lat: 50.7797268,
                long: 6.100391
            },
            input: './env/input_world.js',
            output: './env/output_world.js',
            apiKey: '123466',
            privKey: './env/key_world.pem',
            mode: 0, // Can the worker be triggerd from the outside or only from the inside 
            run: (data, args) => { 
                return 'Hello World'
            }
        }
        c1 = new Component(config,'127.0.0.1')

        expect(c1.config).to.eql(config)
    })

    it('Check for the trigger', () => {
        let Component = require('../lib/worker')
        config = {
            id: '45aa10bf-e185-5102-bff2-e50932bdea8f',
            name: 'hello_world',
            location: {
                lat: 50.7797268,
                long: 6.100391
            },
            input: './env/input_world.js',
            output: './env/output_world.js',
            apiKey: '123466',
            privKey: './env/key_world.pem',
            mode: 0, // Can the worker be triggerd from the outside or only from the inside 
            run: (data, args) => { 
                return 'Hello World'
            }
        }
        c1 = new Component(config,'127.0.0.1')

        expect(c1.trigger.name).to.eql(config.name)
    })

    after(() => {
        mockery.deregisterMock('mqtt')
        mockery.disable()
    })
})

describe('Testing the initialization of the worker with registered id', () => {
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
        mockery.registerMock('./http/register', {
            submit : function (url, registration) {
                return '45aa10bf-e185-5102-bff2-e50932bdea8f'
            }
        })
        mockery.registerMock('fs', {
            existsSync : function (id) {
                return false
            },readFileSync : function (path) {
                //return require('fs').readFileSync('../test/worker.test.key.pem')
            }, writeFileSync : function () {
            }
        })
        mockery.registerMock('./utils/fsutil', {
                ensureDirectoryExistence : function (id) {

                }
            }
        )
        mockery.registerMock('node-persist', {
            getItem : function (id) {
                return '45aa10bf-e185-5102-bff2-e50932bdea8f'
            },setItem : function (id, key) {
            }, init : function () {
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


    it('Check id after init', (done) => {
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
            privKey: './env/key_world.pem',
            mode: 0, // Can the worker be triggerd from the outside or only from the inside 
            run: (data, args) => { 
                return 'Hello World'
            }
        }
        c1 = new Component(config,'127.0.0.1')

        c1.init().then((result) => {
            if(c1.config.id === '45aa10bf-e185-5102-bff2-e50932bdea8f'){
                done()
            }else{
                done('Wrong id: ' + c1.id)
            }
        }).catch((e) => {
            done('Unexpected Error: ' + e)
        })


    })

    afterEach(() => {
        mockery.deregisterAll()
        mockery.disable()
    })
})

describe('Testing the initialization of the worker with key', () => {
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
                return '45aa10bf-e185-5102-bff2-e50932bdea8f'
            }
        })
        mockery.registerMock('require-from-string', 
            function (inp){
                return inp
            }
        )
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
        mockery.enable({
            warnOnReplace: true,
            warnOnUnregistered: false,
            useCleanCache: true
        })
    })


    it('Check for keys after init', (done) => {
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
            privKey: './env/key_world.pem',
            mode: 0, // Can the worker be triggerd from the outside or only from the inside 
            run: (data, args) => { 
                return 'Hello World'
            }
        }
        c1 = new Component(config,'127.0.0.1')

        c1.init().then((result) => {
            if(c1.key.$options.signingScheme === "pkcs1"){
                done()
            }else{
                done('Wrong id: ' + c1.id)
            }
        }).catch((e) => {
            done('Unexpected Error: ' + e)
        })


    })

    afterEach(() => {
        mockery.deregisterAll()
        mockery.disable()
    })
})

describe('Testing the initialization of the worker without key', () => {
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
        mockery.registerMock('./http/register', {
            submit : function (url, registration) {
                return '45aa10bf-e185-5102-bff2-e50932bdea8f'
            }
        })
        mockery.registerMock('require-from-string', 
            function (inp){
                return inp
            }
        )
        mockery.registerMock('./utils/fsutil', {
            ensureDirectoryExistence : function (id) {

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
                return false
            },readFileSync : function (path) {
                return require('./worker.test.key').key
            }, writeFileSync : function () {
            }
        })
        mockery.enable({
            warnOnReplace: true,
            warnOnUnregistered: false,
            useCleanCache: true
        })
    })


    it('Check for keys after init', (done) => {
        let Component = require('../lib/worker')
        config = {
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
        }
        c1 = new Component(config,'127.0.0.1')

        c1.init().then((result) => {
            if(c1.key.$options.signingScheme === "pkcs1"){
                done()
            }else{
                done('Wrong id: ' + c1.id)
            }
        }).catch((e) => {
            done('Unexpected Error: ' + e)
        })
    })

    afterEach(() => {
        mockery.deregisterAll()
        mockery.disable()
    })
})