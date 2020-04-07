//const register = require('./socket/events/register')
const NodeRSA = require('node-rsa')
const fs = require('fs')
const requireFromString = require('require-from-string');
const config = require('nconf')
const debug = require('debug')('worker')
require("colors")

const Ajv = require('ajv')
let ajv = new Ajv({ useDefaults: true })
let configSchema = ajv.compile(require('./schema/config'))

const client = require('./socket/client')
const output = require('./socket/events/output')
const fsutil = require('./utils/fsutil')

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
}


/**
 * Connect should register the worker at the manager
 * or load all required data like id, keys and templates
 */
Worker.prototype.connect = async function () {
    //initialize websocket client
    let socket = await client.init(config.get('apiDomain'), config.get('port'), config.get('id'), config.get('apikey'))
    await client.isConnected()

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

    debug('Registering worker')

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

    await register.submit(this.completeManagerLink + "/core/", {
        schema: schema,
        info: info,
        pubkey: this.key.exportKey('public'),
        name: config.get('name') || '',
        payment: config.get('payment') || '',
        apikey: config.get('apikey') || '',
        location: config.get('location') || '',
        id: config.get('id') || ''
    })

    await client.isRegistered()
    debug('Registered in system')

    const Trigger = require('./trigger/trigger')
    this.trigger = new Trigger(run, this.key, socket)
    this.trigger.setID(config.get('id'))
    debug('Initialisation done')
}



/**
 * This will run the function defined by the second parameter in worker.use locally.
 * Only available if the worker is set to LOCAL or HYBRID otherwise it throws an error
 *
 * @param {Object} data The data to be sent
 * @param {Object} params The specified settings with which the function should run (TODO: find out if needed)
 * @param {Number} price The price of the data set (TODO: Find out if only fixed or whole price)
 */
Worker.prototype.send = async function (data, params, price = undefined) {
    debug('Sending data...')
    if (typeof config.get('id') === 'undefined') {
        throw new Error('Worker is not initialized')
    } else {
        let input = {}
        input.data = datainput
        input.params = params
        let data = await this.trigger.exec(input, {
            id: config.get('id'),
            timestamp: new Date().getTime(),
            price: price === undefined ? 0 : price,
            location:
            {
                latitude: config.get('location.latitude'),
                longitude: config.get('location.longitude'),
            },
            basedOn:
            {
                workerIDs: [],
                dataIDs: [[]]
            }
        })
        return data
    }
}

module.exports = Worker
