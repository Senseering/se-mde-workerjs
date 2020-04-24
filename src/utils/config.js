const debug = require('debug')('utils:config')
const crypto = require("crypto")
const fs = require("fs").promises
const VERSION_ORDER = ["schema", "privKey", "profile", "info", "settings"]



let config = {}

/** 
 * Initialisises the config and reads it the first time
*/
config.init = async function () {
    config.file = new Promise(async (resolve, reject) => {
        try {
            resolve(await config.get("full", { fromFile: true }))
        } catch (error) {
            reject(error)
        }
    })
}


/** 
 * Return a specified field fully resolved or get the full config with 'full'
 * @param request The field or full config to resolve 
*/
config.get = async function (request, { fromFile = false } = {}) {
    debug("Retrieve from config: " + request)
    if (fromFile) {
        let configFile = JSON.parse(await fs.readFile("./config.json", "utf-8"))
        if (request === "full") {
            return {
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
            configFile.privKey = await fs.readFile(configFile.privKey, 'utf8')
            return configFile.privKey
        case "schema":
            configFile.schema.input = JSON.parse(await fs.readFile(configFile.schema.input, "utf-8"))
            configFile.schema.output = JSON.parse(await fs.readFile(configFile.schema.output, "utf-8"))
            return configFile.schema
        case "info":
            configFile.info.worker.description = await fs.readFile(configFile.info.worker.description, "utf-8")
            configFile.info.input.description = await fs.readFile(configFile.info.input.description, "utf-8")
            configFile.info.output.description = await fs.readFile(configFile.info.output.description, "utf-8")
            return configFile.info
        default:
            return configFile[field]
    }
}

/** 
 * Comparing a version ( every number is mapped to the corresponding hash ) to the underlying files
 * @param version The version e.g. ( 'qI7[...]FwA=.qI7[...]FwA=.qI7[...]FwA=' )
*/
config.compare = async function (version) {
    debug("Compare the version with: " + version)
    let hashes = version.split(".")
    let change = []
    for (const [index, hash] of hashes.entries()) {
        let configuration = await config.get(VERSION_ORDER[index])
        let configurationHash = crypto.createHash('sha256').update(JSON.stringify(configuration)).digest('base64')
        if (hash === configurationHash) {
            change[index] = 0
        } else {
            change[index] = 1
        }
    }
    return change.join(".")
}

/** 
 * Updating specific field with a configuration
 * @param field The field to update
 * @param configuration The update configuration
*/
config.update = async function (field, configuration, { recursive = false, spacing = 2 } = {}) {
    debug("Updating: " + field)
    let managedConfig = await config.file
    config.file = new Promise(async (resolve, reject) => {
        try {
            let configFile = JSON.parse(await fs.readFile("./config.json", "utf-8"))
            if (recursive) {
                switch (field) {
                    case "privKey":
                        await fs.writeFile(configFile.privKey, configuration)
                        // Write into provisioned configuration
                        managedConfig.privKey = configuration
                        resolve(managedConfig)
                        break;
                    case "schema":
                        // Recursive write schenmas
                        await fs.writeFile(configFile.schema.output, configuration.output)
                        await fs.writeFile(configFile.schema.input, configuration.input)
                        // Overwrite schemas with file location
                        configuration.schema.output = configFile.output
                        configuration.schema.input = configFile.input
                        // Overwrite old file with new file 
                        configFile.info = configuration
                        // Write to config
                        await fs.writeFile("./config.json", JSON.stringify(configFile, null, spacing))
                        // Write into provisioned configuration
                        managedConfig.schema = configuration
                        resolve(managedConfig)
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
                        await fs.writeFile("./config.json", JSON.stringify(configFile, null, spacing))
                        // Write into provisioned configuration
                        managedConfig.info = configuration
                        resolve(managedConfig)
                        break;
                    default:
                        configFile[field] = configuration
                        await fs.writeFile("./config.json", JSON.stringify(configFile, null, spacing))
                        // Write into provisioned configuration
                        managedConfig[field] = configuration
                        resolve(managedConfig)
                        break;
                }
            } else {
                configFile[field] = configuration
                await fs.writeFile("./config.json", JSON.stringify(configFile, null, spacing))
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
                managedConfig[field] = configuration
                resolve(managedConfig)
            }
        } catch (error) {
            reject(error)
        }
    })
}

module.exports = {
    compare: config.compare,
    get: config.get,
    init: config.init,
    update: config.update,
}
