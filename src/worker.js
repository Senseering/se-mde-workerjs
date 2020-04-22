const NodeRSA = require('node-rsa')
const fs = require('fs')
const requireFromString = require('require-from-string');
const config = require('nconf')
const debug = require('debug')('worker')
require('colors')

const Ajv = require('ajv')
let ajv = new Ajv({ useDefaults: true })
let configSchema = ajv.compile(require('./schema/config/config'))

const fsutil = require('./utils/fsutil')
const client = require('./socket/client')
const publish = require('./socket/events/publish')
const register = require('./socket/events/register')

/**
 * Is used to register at a manager with the necessary options given. It checks if the worker is
 * registered and registers it automatically if not.
 * @param {Object} params Object which configures the worker
 */
function Worker(params) {
    //check if updated version of config exists (meaning worker exists already)
    if (fs.existsSync('./config/development.json')) {
        debug("Loading configuration... ")
        config.file({ file: './config/development.json', logicalSeparator: '.' })
    } else {
        //worker started the first time.. get full config for registration
        let conf_object = {}
        if (params !== undefined) {
            if (typeof (params) == 'object') {
                conf_object = params
                //save object to file for config manager to get
                debug('Using given config object')
                fs.writeFileSync('./config/config.json', JSON.stringify(params, null, 4), 'utf8')
                config.file({ file: './config/config.json', logicalSeparator: '.' })
                fs.unlinkSync('.config/config.json')
            } else if (typeof (params) == 'string') {
                if (fs.existsSync(params)) {
                    debug('Using config file in given location')
                    config.file({ file: params, logicalSeparator: '.' })
                    conf_object = JSON.parse(fs.readFileSync(params, 'utf8'))
                } else {
                    throw new Error('Config file not found')
                }
            }
        } else {
            debug('Using default config file development.json')
            config.file({ file: './config/development.json', logicalSeparator: '.' })
            conf_object = JSON.parse(fs.readFileSync('./config/development.json', 'utf8'))
        }

        let validated = configSchema(conf_object)
        if (!validated) {
            throw new Error('Config schema does not match')
        }

        if (conf_object.id === 'not_provided' || conf_object.name === 'not_provided' || conf_object.apikey === 'not_provided') {
            let development_config = (JSON.parse(fs.readFileSync('./config/development.json', 'utf8')))

            for (var key of ['id', 'name', 'apikey']) {
                if (conf_object[key] === 'not_provided') {
                    config.set(key, development_config[key])
                }
            }
        }

        this.completeManagerLink = config.get('apiDomain') + ':' + config.get('port')
        if (config.get('apiDomain') === '') {
            throw new Error('No manager ip used')
        }

        this.community = false
        if (config.get('schema').hasOwnProperty("link")) {
            this.community = true
        }
    }

    this.isRegistered = false
}


/**
 * Connect should establish the websocket connection to the manager and register the worker
 * or load all required data like id, keys and templates
 */
Worker.prototype.connect = async function () {

    debug('Connecting client...')
    client.init(config.get('apiDomain'), config.get('port'), config.get('id'), config.get('apikey'))

    //register worker if not already done in the past
    if (!this.isRegistered) {
        //generate key
        fsutil.ensureDirectoryExistence(config.get('privKey'))
        if (fs.existsSync(config.get('privKey'))) {
            debug("Key found...")
            let keyModuleString = fs.readFileSync(config.get('privKey'), 'utf8')
            let keyString = requireFromString(keyModuleString).key
            this.key = new NodeRSA(keyString)
            debug("Key imported.");
        } else {
            debug("Key generation in progress...")
            this.key = new NodeRSA({ b: 1024 })
            fs.writeFileSync(config.get('privKey'), 'module.exports = ' + JSON.stringify({ key: this.key.exportKey('private') }))
            debug("Key generated.")
        }

        debug('Fetching registration details')

        let schema = {}
        let info = {}
        if (config.get('schema') !== undefined) {
            if (config.get('schema').link !== undefined) {
                //worker of a specific community 
                schema.link = config.get('schema').link
                if (config.get('schema').commit !== undefined) {
                    schema.commit = config.get('schema').commit
                }
                if (fs.existsSync("./env/schema")) {
                    debug("WARNING: Worker joins the community and the custom schema in: ./env/schema was not used".red)
                }
                //there are no custon descriptions for input and output schemas of community-workers
                info.description = fs.readFileSync(config.get('info').description, "utf8")
                info.tags = config.get('info').tags
            } else {
                //worker without community
                schema.input = JSON.parse(fs.readFileSync(config.get('schema').input, "utf8"))
                schema.output = JSON.parse(fs.readFileSync(config.get('schema').output, "utf8"))
                info = {
                    description: fs.readFileSync(config.get('info').description, "utf8"),
                    tags: config.get('info').tags,
                    input: config.get("info").hasOwnProperty("input") ? {
                        description: config.get('info').input.hasOwnProperty("description") ? fs.readFileSync(config.get('info').input.description, "utf8") : "",
                        tags: config.get('info').input.hasOwnProperty("tags") ? config.get('info').input.tags : []
                    } : {
                            description: "",
                            tags: []
                        },
                    output: config.get("info").hasOwnProperty("output") ? {
                        description: config.get('info').output.hasOwnProperty("description") ? fs.readFileSync(config.get('info').output.description, "utf8") : "",
                        tags: config.get('info').output.hasOwnProperty("tags") ? config.get('info').output.tags : []
                    } : {
                            description: "",
                            tags: []
                        }

                }
            }
        }

        //initialize websocket client and register worker on manager
        let registration = {
            schema: schema,
            info: info,
            pubkey: this.key.exportKey('public'),
            name: config.get('name') || '',
            payment: config.get('payment') || '',
            apikey: config.get('apikey') || '',
            location: config.get('location') || '',
            id: config.get('id') || ''
        }

        debug('Registering worker')

        await register(registration)
        await client.isRegistered()
        this.isRegistered = true
        debug('Worker registered in system')
    }
    debug('Initialisation done')
}


/**
 * This will publish data on the manager
 *
 * @param {Object} data The data to be published
 */
Worker.prototype.publish = async function (data, options) {
    if(options === undefined){
        options = {}
    }
    debug('Preparing data for publish on manager...')
    if (typeof config.get('id') === 'undefined') {
        throw new Error('Worker is not initialized')
    } else {
        let result
        let meta = {
            worker_id: config.get('id'),
            created_at: Date.now(),
            price: options.price === undefined ? 0 : options.price,
            location:
            {
                latitude: config.get('location.latitude'),
                longitude: config.get('location.longitude')
            }
        }
        //append basedOn property just in case of service
        if (config.get("schema").input) {
            meta.basedOn = {
                workerIDs: [],
                dataIDs: [[]]
            }
        }

        let receivePromise = new Promise(async (resolve, reject) => {
            try {
                result = await publish({meta, data }, { statusID: undefined, key: this.key, resolvePromise: resolve, ttl: options.ttl })
            } catch (err) {
                reject(err)
            }
        })

        await receivePromise
        return result
    }
}


/**
 * This sets the service function that can be triggered and executed on demand
 *
 * @param {Object} service The function that can be triggered and executed on demand
 */
Worker.prototype.provide = async function (service) {
    debug('Setting service function...')

    //set trigger
    const Trigger = require('./trigger/trigger')
    this.trigger = new Trigger(this.key, service)
}


/**
 * This disconnects the client from the manager
 */
Worker.prototype.disconnect = async function () {
    debug('Disconnecting client...')
    await client.disconnect()
}

module.exports = Worker
