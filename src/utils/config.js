const debug = require('debug')('utils:config')
const crypto = require("crypto")
const fs = require("fs").promises
const VERSION_ORDER = ["schema", "privKey", "profile", "info", "settings"]
const NodeRSA = require('node-rsa')



let config = {}


/** 
 * Return a specified field fully resolved or get the full config with 'full'
 * @param request The field or full config to resolve 
*/
config.get = async function (request) {
    debug("Retrieve from config: " + request)
    let config = JSON.parse(await fs.readFile("./config.json"))
    if (request === "full") {
        return {
            "schema": await config.resolve(config, "schema"),
            "pubKey": await config.resolve(config, "privKey"),
            "profile": await config.resolve(config, "profile"),
            "info": await config.resolve(config, "info"),
            "settings": await config.resolve(config, "settings"),
        }
    } else {
        return await config.resolve(config, "request")
    }
}

/** 
 * Resolving a specified field of a given config with the correct files
 * @param config Given config object 
 * @param field The field to resolve
*/
config.resolve = async function (config, field) {
    debug("Resolve from config: " + field)
    switch (field) {
        case "profile":
            return config.profile
        case "privKey":
            let key = new NodeRSA(await fs.readFile(config.privKey, 'utf8'))
            return key.exportKey('public')
        case "schema":
            config.schema.input = JSON.parse(await fs.readFile(config.schema.input))
            config.schema.output = JSON.parse(await fs.readFile(config.schema.output))
            return config.schema
        case "info":
            config.info.worker.description = await fs.readFile(config.info.worker.description)
            config.info.input.description = await fs.readFile(config.info.input.description)
            config.info.output.description = await fs.readFile(config.info.output.description)
            return config.info
        case "settings":
            return config.settings
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
    hashes.forEach((hash, index) => {
        let configuration = await config.get(VERSION_ORDER[index])
        let configurationHash = crypto.createHash('sha256').update(JSON.stringify(configuration)).digest('base64')
        if (hash === configurationHash) {
            change[index] = 1
        } else {
            change[index] = 0
        }
    })
    return change.join(".")
}

/** 
 * Updating specific field with a configuration
 * @param field The field to update
 * @param configuration The update configuration
*/
config.update = async function (field, configuration) {
    debug("Updating: " + field)
    let config = JSON.parse(await fs.readFile("./config.json"))
    config[field] = configuration
    await fs.writeFile("./config.json", config)
}

module.exports = config
