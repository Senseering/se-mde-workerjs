const debug = require('debug')('utils:config')
const crypto = require("crypto")
const Ajv = require('ajv')
const ajv = new Ajv({ useDefaults: true })
const NodeRSA = require('node-rsa')
const validateConfig = ajv.compile(require("./schema/config.json"));
const VERSION_ORDER = ["schema", "privKey", "profile", "info", "settings", "payment", "meta"]
const PRIVAT_KEY_BIT = 1024
const DEFAULT_PATH = "./config.json"
const stringify = require('fast-json-stable-stringify')


let persistence = {}

let config = {}
config.version = {}
config.version.component = {}
VERSION_ORDER.forEach((configuration) => config.version.component[configuration] = {})

config.settings = {}
config.meta = {}

/** 
 * Initialisises the config and reads it the first time
 */
config.init = async function (path = DEFAULT_PATH) {
    config.file = new Promise(async (resolve, reject) => {
        try {
            if (typeof path === 'string') {
                persistence = require('./storage/filesystem')
                let configFile = JSON.parse(await persistence.read(path))
                let valid = validateConfig(configFile)
                if (!valid)
                    throw new Error(validateConfig.errors[0].dataPath + " " + validateConfig.errors[0].message)
                new URL(configFile.url)
                config.path = path
            } else if (typeof path === 'object') {
                persistence = require('./storage/inMemory')
                let configFile = path
                let valid = validateConfig(configFile)
                if (!valid)
                    throw new Error(validateConfig.errors[0].dataPath + " " + validateConfig.errors[0].message)
                new URL(configFile.url)
                persistence.write('./env/description/input.md', configFile.info.input.description)
                configFile.info.input.description = './env/description/input.md'
                persistence.write('./env/description/output.md', configFile.info.output.description)
                configFile.info.output.description = './env/description/output.md'
                persistence.write('./env/description/worker.md', configFile.info.worker.description)
                configFile.info.worker.description = './env/description/worker.md'
                persistence.write('./env/schema/output.json', JSON.stringify(configFile.schema.output))
                configFile.schema.output = './env/schema/output.json'
                persistence.write('./env/schema/input.json', JSON.stringify(configFile.schema.input))
                configFile.schema.input = './env/schema/input.json'
                persistence.write('./env/key.pem', configFile.privKey)
                configFile.privKey = './env/key.pem'
                persistence.write('./config.json', JSON.stringify(configFile))
                new URL(configFile.url)
                config.path = DEFAULT_PATH
            }
            resolve(await config.get("full", { fromFile: true }))
        } catch (error) {
            reject(error)
        }
    })
    return config.file
}


/** 
 * Return a specified field fully resolved or get the full config with 'full'
 * @param request The field or full config to resolve 
*/
config.get = async function (request, { fromFile = false } = {}) {
    debug("Retrieve from config: " + request)
    if (fromFile) {
        let configFile = JSON.parse(await persistence.read(config.path))
        if (request === "full") {
            return {
                "credentials": await config.resolve(configFile, "credentials"),
                "payment": await config.resolve(configFile, "payment"),
                "url": await config.resolve(configFile, "url"),
                "schema": await config.resolve(configFile, "schema"),
                "privKey": await config.resolve(configFile, "privKey"),
                "profile": await config.resolve(configFile, "profile"),
                "info": await config.resolve(configFile, "info"),
                "settings": await config.resolve(configFile, "settings"),
                "meta": await config.resolve(configFile, "meta"),
            }
        } else {
            return await config.resolve(configFile, request)
        }
    } else {
        if (request === "full") {
            return await config.file
        } else {
            return (await config.file)[request]
        }
    }
}

/** 
 * Resolving a specified field of a given config with the correct files
 * @param configFile Given config object 
 * @param field The field to resolve
*/
config.resolve = async function (configFile, field) {
    debug("Resolve from file: " + field)
    switch (field) {
        case "privKey":
            try {
                configFile.privKey = await persistence.read(configFile.privKey)
            } catch (err) {
                if (err.code === "ENOENT") {
                    debug("Could not find private key. Creating one...")
                    await persistence.directory(configFile.privKey)
                    let privKeyLocation = configFile.privKey
                    configFile.privKey = (new NodeRSA({ b: PRIVAT_KEY_BIT })).exportKey('private')
                    await persistence.write(privKeyLocation, configFile.privKey)
                } else {
                    throw err
                }
            }
            break;
        case "schema":
            try {
                configFile.schema.input = JSON.parse(await persistence.read(configFile.schema.input))
            } catch (err) {
                if (err.code === "ENOENT") {
                    debug("Could not find input schema. Creating one...")
                    await persistence.directory(configFile.schema.input)
                    await persistence.write(configFile.schema.input, JSON.stringify({}))
                    configFile.schema.input = {}
                } else {
                    throw err
                }
            }
            try {
                configFile.schema.output = JSON.parse(await persistence.read(configFile.schema.output))
            } catch (err) {
                if (err.code === "ENOENT") {
                    debug("Could not find output schema. Creating one...")
                    await persistence.directory(configFile.schema.output)
                    await persistence.write(configFile.schema.output, JSON.stringify({}))
                    configFile.schema.output = {}
                } else {
                    throw err
                }
            }
            break;
        case "info":
            try {
                configFile.info.worker.description = await persistence.read(configFile.info.worker.description)
            } catch (err) {
                if (err.code === "ENOENT") {
                    debug("Could not find worker description. Creating one...")
                    await persistence.directory(configFile.info.worker.description)
                    await persistence.write(configFile.info.worker.description, "")
                    configFile.info.worker.description = ""
                } else {
                    throw err
                }
            }
            try {
                configFile.info.input.description = await persistence.read(configFile.info.input.description)
            } catch (err) {
                if (err.code === "ENOENT") {
                    debug("Could not find input description. Creating one...")
                    await persistence.directory(configFile.info.input.description)
                    await persistence.write(configFile.info.input.description, "")
                    configFile.info.input.description = ""
                } else {
                    throw err
                }
            }
            try {
                configFile.info.output.description = await persistence.read(configFile.info.output.description)
            } catch (err) {
                if (err.code === "ENOENT") {
                    debug("Could not find output description. Creating one...")
                    await persistence.directory(configFile.info.output.description)
                    await persistence.write(configFile.info.output.description, "")
                    configFile.info.output.description = ""
                } else {
                    throw err
                }
            }
            break;
        default:
            break;
    }
    if (VERSION_ORDER.includes(field))
        await config.version.update(field, configFile[field])
    return configFile[field]
}
/** 
 * Updating specific field with a configuration
 * @param field The field to update
 * @param configuration The update configuration
*/
config.update = async function (field, configuration, { recursive = false, spacing = 2 } = {}) {
    let managedConfig = await config.file

    config.file = new Promise(async (resolve, reject) => {
        debug("Updating: " + field)
        try {
            let configFile = JSON.parse(await persistence.read(config.path))

            // Check against schema -- Too Hacky
            // Copy to not mess with actual work later
            let configCopy = JSON.parse(JSON.stringify(configFile))
            debug(configuration)
            let configurationCopy = JSON.parse(JSON.stringify(configuration))
            // Rewrite fields to be comparable
            if (recursive) {
                switch (field) {
                    case "privKey":
                        break;
                    case "schema":
                        configurationCopy.output = configCopy.schema.output
                        configurationCopy.input = configCopy.schema.input
                        configCopy.schema = configurationCopy
                        break;
                    case "info":
                        configurationCopy.output.description = configCopy.info.output.description
                        configurationCopy.input.description = configCopy.info.input.description
                        configurationCopy.worker.description = configCopy.info.worker.description
                        // Overwrite old file with new file ( tags missing in old file )
                        configCopy.info = configurationCopy
                        break;
                    default:
                        configCopy[field] = configurationCopy
                        break;
                }
            } else {
                configCopy[field] = configurationCopy
            }
            // Check against schema
            let valid = validateConfig(configCopy)
            if (!valid) {
                throw new Error(validateConfig.errors[0].dataPath + " " + validateConfig.errors[0].message)
            }

            if (recursive) {
                switch (field) {
                    case "privKey":
                        await persistence.write(configFile.privKey, configuration)
                        break;
                    case "schema":
                        // Recursive write schenmas
                        await persistence.write(configFile.schema.output, JSON.stringify(configuration.output, null, spacing))
                        await persistence.write(configFile.schema.input, JSON.stringify(configuration.input, null, spacing))
                        // Overwrite old file with new file 
                        configFile.schema = {
                            output: configFile.schema.output,
                            input: configFile.schema.input
                        }
                        // Write to config
                        await persistence.write(config.path, JSON.stringify(configFile, null, spacing))
                        break;
                    case "info":
                        // Recursive write descriptions
                        await persistence.write(configFile.info.worker.description, configuration.worker.description)
                        await persistence.write(configFile.info.input.description, configuration.input.description)
                        await persistence.write(configFile.info.output.description, configuration.output.description)
                        // Overwrite old file with new file ( tags missing in old file )
                        configFile.info = {
                            output: configFile.info.output,
                            input: configFile.info.input,
                            worker: configFile.info.worker
                        }
                        // Write to config
                        await persistence.write(config.path, JSON.stringify(configFile, null, spacing))
                        break;
                    default:
                        configFile[field] = configuration
                        await persistence.write(config.path, JSON.stringify(configFile, null, spacing))
                        break;
                }
            } else {
                configFile[field] = configuration
                await persistence.write(config.path, JSON.stringify(configFile, null, spacing))
                switch (field) {
                    case "privKey":
                        break;
                    case "schema":
                        delete configuration.schema.output
                        delete configuration.schema.input
                        break;
                    case "info":
                        delete configuration.output.description
                        delete configuration.input.description
                        delete configuration.worker.description
                        break;
                }
            }
            managedConfig[field] = configuration
            if (VERSION_ORDER.includes(field))
                await config.version.update(field, managedConfig[field])
            resolve(managedConfig)
        } catch (error) {
            reject(error)
        }
    })
    return config.file
}

/***
 * Returns the current verison
 */
config.version.get = async function () {
    await config.file
    let versions = []
    VERSION_ORDER.forEach((field) => {
        versions.push(config.version.component[field].hash + "@" + config.version.component[field].timestamp)
    })
    return versions.join(".")
}



/**
 * @param configuration the full config opject
 * @param field the field to update e.g. schema, info etc.
*/
config.version.update = async function (field, configuration) {
    let configFile = JSON.parse(await persistence.read(config.path))
    let configurationHash
    if (field === "privKey") {
        let key = (new NodeRSA(configuration)).exportKey('public')
        configurationHash = crypto.createHash('sha256').update(key).digest('base64')
    } else {
        configurationHash = crypto.createHash('sha256').update(stringify(configuration)).digest('base64')
    }
    let configurationTimestamp = await persistence.time(config.path)
    let valid = validateConfig(configFile)
    if (!valid)
        throw new Error(validateConfig.errors[0].dataPath + " " + validateConfig.errors[0].message)
    switch (field) {
        case "privKey":
            configurationTimestamp = Math.max(configurationTimestamp, await persistence.time(configFile.privKey))
            break;
        case "schema":
            configurationTimestamp = Math.max(configurationTimestamp, await persistence.time(configFile.schema.input))
            configurationTimestamp = Math.max(configurationTimestamp, await persistence.time(configFile.schema.output))
            break;
        case "info":
            configurationTimestamp = Math.max(configurationTimestamp, await persistence.time(configFile.info.input.description))
            configurationTimestamp = Math.max(configurationTimestamp, await persistence.time(configFile.info.output.description))
            configurationTimestamp = Math.max(configurationTimestamp, await persistence.time(configFile.info.worker.description))
        default:
            break;
    }
    config.version.component[field].hash = configurationHash
    config.version.component[field].timestamp = configurationTimestamp
}

/** 
 * Comparing a version ( every number is mapped to the corresponding hash ) to the underlying files
 * @param version The version e.g. ( 'qI7[...]FwA=.qI7[...]FwA=.qI7[...]FwA=' )
*/
config.version.compare = async function (version) {
    debug("Compare the version with: " + version)
    await config.file
    let hashes = version.split(".")
    let change = []
    for (const [index, version] of hashes.entries()) {
        let [hash, timestamp] = version.split("@")
        if (hash === config.version.component[VERSION_ORDER[index]].hash) {
            change[index] = 0
        } else {
            if (timestamp >= config.version.component[VERSION_ORDER[index]].timestamp) {
                change[index] = 1
            } else {
                change[index] = -1
            }
        }
    }
    return change.join(".")
}

/**
 * Returns the requested changes
 * @param changes Requested changes e.g. 1.1.1.1.1
 */
config.version.changes = async function (changes) {
    let result = {}
    for (const [index, change] of (changes.split(".")).entries()) {
        if (change === "1") {
            if (VERSION_ORDER[index] !== "privKey") {
                result[VERSION_ORDER[index]] = await config.get(VERSION_ORDER[index])
            } else {
                result["pubkey"] = (new NodeRSA(await config.get(VERSION_ORDER[index]))).exportKey('public')
            }
        }
    }
    return result
}


/**
 * Returns the settings
 */
config.settings.get = async function () {
    return await config.get("settings")
}

/**
 * Updates the settings object
 * @param settings The value to update
 */
config.settings.update = async function (settings) {
    await config.update("settings", settings)
}

/**
 * Returns the current meta data
 */
config.meta.get = async function () {
    return await config.get("meta")
}

/**
 * Updates the meta object
 * @param meta The value to update
 */
config.meta.update = async function (meta) {
    await config.update("meta", meta)
}

module.exports = {
    version: {
        compare: config.version.compare,
        get: config.version.get,
        changes: config.version.changes
    },
    settings: {
        get: config.settings.get,
        update: config.settings.update
    },
    meta: {
        get: config.meta.get,
        update: config.meta.update
    },
    get: config.get,
    init: config.init,
    update: config.update,
    VERSION_ORDER,
}
