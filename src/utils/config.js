const debug = require('debug')('utils:config')
const crypto = require("crypto")
const fs = require("fs").promises
const fsutil = require('./fsutil')
const Ajv = require('ajv')
const ajv = new Ajv()
const NodeRSA = require('node-rsa')
const validateConfig = ajv.compile(require("./configSchema.json"));
const VERSION_ORDER = ["schema", "privKey", "profile", "info", "settings", "payment"]
const PRIVAT_KEY_BIT = 1024



let config = {}
config.version = {}
VERSION_ORDER.forEach((configuration) => config.version[configuration] = {})


/** 
 * Initialisises the config and reads it the first time
 */
config.init = async function (path = "./config.json") {
    config.file = new Promise(async (resolve, reject) => {
        try {
            let configFile = JSON.parse(await fs.readFile(path, "utf-8"))
            let valid = validateConfig(configFile)
            if (!valid)
                throw new Error(validateConfig.errors[0].dataPath + " " + validateConfig.errors[0].message)
            new URL(configFile.url)
            config.path = path
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
        let configFile = JSON.parse(await fs.readFile(config.path, "utf-8"))
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
                configFile.privKey = await fs.readFile(configFile.privKey, 'utf8')
            } catch (err) {
                if (err.code === "ENOENT") {
                    debug("Could not find privat key. Creating one...")
                    fsutil.ensureDirectoryExistence(configFile.privKey)
                    let privKeyLocation = configFile.privKey
                    configFile.privKey = (new NodeRSA({ b: PRIVAT_KEY_BIT })).exportKey('private')
                    await fs.writeFile(privKeyLocation, configFile.privKey)
                } else {
                    throw err
                }
            }
            break;
        case "schema":
            try {
                configFile.schema.input = JSON.parse(await fs.readFile(configFile.schema.input, "utf-8"))
            } catch (err) {
                if (err.code === "ENOENT") {
                    debug("Could not find input schema. Creating one...")
                    fsutil.ensureDirectoryExistence(configFile.schema.input)
                    await fs.writeFile(configFile.schema.input, JSON.stringify({}))
                    configFile.schema.input = {}
                } else {
                    throw err
                }
            }
            try {
                configFile.schema.output = JSON.parse(await fs.readFile(configFile.schema.output, "utf-8"))
            } catch (err) {
                if (err.code === "ENOENT") {
                    debug("Could not find output schema. Creating one...")
                    fsutil.ensureDirectoryExistence(configFile.schema.output)
                    await fs.writeFile(configFile.schema.output, JSON.stringify({}))
                    configFile.schema.output = {}
                } else {
                    throw err
                }
            }
            break;
        case "info":
            try {
                configFile.info.worker.description = await fs.readFile(configFile.info.worker.description, "utf-8")
            } catch (err) {
                if (err.code === "ENOENT") {
                    debug("Could not find worker descrition. Creating one...")
                    fsutil.ensureDirectoryExistence(configFile.info.worker.description)
                    await fs.writeFile(configFile.info.worker.description, "")
                    configFile.info.worker.description = {}
                } else {
                    throw err
                }
            }
            try {
                configFile.info.input.description = await fs.readFile(configFile.info.input.description, "utf-8")
            } catch (err) {
                if (err.code === "ENOENT") {
                    debug("Could not find input descrition. Creating one...")
                    fsutil.ensureDirectoryExistence(configFile.info.input.description)
                    await fs.writeFile(configFile.info.input.description, "")
                    configFile.info.input.description = {}
                } else {
                    throw err
                }
            }
            try {
                configFile.info.output.description = await fs.readFile(configFile.info.output.description, "utf-8")
            } catch (err) {
                if (err.code === "ENOENT") {
                    debug("Could not find output descrition. Creating one...")
                    fsutil.ensureDirectoryExistence(configFile.info.output.description)
                    await fs.writeFile(configFile.info.output.description, "")
                    configFile.info.output.description = {}
                } else {
                    throw err
                }
            }
            break;
        default:
            break;
    }
    if (VERSION_ORDER.includes(field))
        await config.updateVersion(field, configFile[field])
    return configFile[field]
}

/***
 * Returns the current verison
 */
config.getVersion = async function () {
    await config.file
    let versions = []
    VERSION_ORDER.forEach((field) => {
        versions.push(config.version[field].hash + "@" + config.version[field].timestamp)
    })
    return versions.join(".")
}



/**
 * @param configuration the full config opject
 * @param field the field to update e.g. schema, info etc.
*/
config.updateVersion = async function (field, configuration) {
    let configFile = JSON.parse(await fs.readFile(config.path, "utf-8"))
    let configurationHash
    if(field === "privKey"){
        let key = (new NodeRSA(configuration)).exportKey('public')
        configurationHash = crypto.createHash('sha256').update(key).digest('base64')
    }else{
        configurationHash = crypto.createHash('sha256').update(JSON.stringify(configuration)).digest('base64')
    }
    let configurationTimestamp = parseInt((await fs.lstat(config.path)).mtimeMs)
    let valid = validateConfig(configFile)
    if (!valid)
        throw new Error(validateConfig.errors[0].dataPath + " " + validateConfig.errors[0].message)
    switch (field) {
        case "privKey":
            configurationTimestamp = Math.max(configurationTimestamp, parseInt((await fs.lstat(configFile.privKey)).mtimeMs))
            break;
        case "schema":
            configurationTimestamp = Math.max(configurationTimestamp, parseInt((await fs.lstat(configFile.schema.input)).mtimeMs))
            configurationTimestamp = Math.max(configurationTimestamp, parseInt((await fs.lstat(configFile.schema.output)).mtimeMs))
            break;
        case "info":
            configurationTimestamp = Math.max(configurationTimestamp, parseInt((await fs.lstat(configFile.info.input.description)).mtimeMs))
            configurationTimestamp = Math.max(configurationTimestamp, parseInt((await fs.lstat(configFile.info.output.description)).mtimeMs))
            configurationTimestamp = Math.max(configurationTimestamp, parseInt((await fs.lstat(configFile.info.worker.description)).mtimeMs))
        default:
            break;
    }
    config.version[field].hash = configurationHash
    config.version[field].timestamp = configurationTimestamp
}

/** 
 * Comparing a version ( every number is mapped to the corresponding hash ) to the underlying files
 * @param version The version e.g. ( 'qI7[...]FwA=.qI7[...]FwA=.qI7[...]FwA=' )
*/
config.compare = async function (version) {
    debug("Compare the version with: " + version)
    await config.file
    let hashes = version.split(".")
    let change = []
    for (const [index, version] of hashes.entries()) {
        let [hash, timestamp] = version.split("@")
        if (hash === config.version[VERSION_ORDER[index]].hash) {
            change[index] = 0
        } else {
            if (timestamp >= config.version[VERSION_ORDER[index]].timestamp) {
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
config.getChanges = async function (changes){
    let result = {}
    for (const [index, change] of (changes.split(".")).entries()) {
        if(change === "1"){
            if(VERSION_ORDER[index] !== "privKey"){
                result[VERSION_ORDER[index]] = await config.get(VERSION_ORDER[index])
            } else {
                result["pubkey"] =  (new NodeRSA(await config.get(VERSION_ORDER[index]))).exportKey('public')
            }
        }
    }
    return result
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
            let configFile = JSON.parse(await fs.readFile(config.path, "utf-8"))

            // Check against schema -- Too Hacky
            // Copy to not mess with actual work later
            let configCopy = JSON.parse(JSON.stringify(configFile))
            let configurationCopy = JSON.parse(JSON.stringify(configuration))
            // Rewrite fields to be comparable
            if (recursive) {
                switch (field) {
                    case "privKey":
                        break;
                    case "schema":
                        configurationCopy.schema.output = configCopy.output
                        configurationCopy.schema.input = configCopy.input
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
                        await fs.writeFile(configFile.privKey, configuration)
                        break;
                    case "schema":
                        // Recursive write schenmas
                        await fs.writeFile(configFile.schema.output, configuration.output)
                        await fs.writeFile(configFile.schema.input, configuration.input)
                        // Overwrite schemas with file location
                        configuration.schema.output = configFile.output
                        configuration.schema.input = configFile.input
                        // Overwrite old file with new file 
                        configFile.schema = configuration
                        // Write to config
                        await fs.writeFile(config.path, JSON.stringify(configFile, null, spacing))
                        break;
                    case "info":
                        // Recursive write descriptions
                        await fs.writeFile(configFile.info.worker.description, configuration.worker.description)
                        await fs.writeFile(configFile.info.input.description, configuration.input.description)
                        await fs.writeFile(configFile.info.output.description, configuration.output.description)
                        // Overwrite descriptions with file location
                        configuration.output.description = configFile.info.output.description
                        configuration.input.description = configFile.info.input.description
                        configuration.worker.description = configFile.info.worker.description
                        // Overwrite old file with new file ( tags missing in old file )
                        configFile.info = configuration
                        // Write to config
                        await fs.writeFile(config.path, JSON.stringify(configFile, null, spacing))
                        break;
                    default:
                        configFile[field] = configuration
                        await fs.writeFile(config.path, JSON.stringify(configFile, null, spacing))
                        break;
                }
            } else {
                configFile[field] = configuration
                await fs.writeFile(config.path, JSON.stringify(configFile, null, spacing))
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
                await config.updateVersion(field, managedConfig[field])
            resolve(managedConfig)
        } catch (error) {
            reject(error)
        }
    })
    return config.file
}

module.exports = {
    compare: config.compare,
    get: config.get,
    init: config.init,
    update: config.update,
    getVersion: config.getVersion,
    getChanges: config.getChanges,
    VERSION_ORDER,
}
