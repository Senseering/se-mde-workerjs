const config = require("nconf")
const fs = require("fs")
const debug = require("debug")("socket:update")
require("colors")

/** 
 * Update config file so that 
 * @param {Object} update 
 */
let update = async function (update) {
    //prepare worker for update from manager
    debug(('Updating worker details: ' + JSON.stringify(Object.keys(update))).yellow)
    for (var key of Object.keys(update)) {
        //never update login credentials
        if (key === "payment") {
            for (paymenttype of Object.keys(update[key])) {
                debug("Updating payment:" + paymenttype + " with value " + update[key][paymenttype])
                config.set('payment.' + paymenttype, update[key][paymenttype])
            }
        } else if (key === "schema") {
            if (!fs.existsSync("./env/schema")) {
                fs.mkdirSync("./env/schema")
            }


            if (update.schema.hasOwnProperty("link")) {
                config.get("schema").hasOwnProperty("link") ? debug("Leaving community: " + config.get("schema").link) : debug("No longer using custom schema...")
                debug("joining community: " + update.schema.link)
                config.clear("schema.input")
                config.clear("schema.output")
                config.set("schema.link", update.schema.link)
                if (update.schema.commit !== undefined) {
                    config.set("schema.commit", update.schema.commit)
                }
            } else if (update.schema.input !== undefined && update.schema.output !== undefined) {
                //overwrite the local schema 
                debug("local inputschema was overwritten")
                if (config.get("schema").hasOwnProperty("link")) { debug("leaving group: " + config.get("schema").link) }
                //input
                config.set("schema.input", "./env/schema/input.json")
                config.clear("schema.link")
                config.clear("schema.commit")
                fs.writeFileSync("./env/schema/input.json", JSON.stringify(update.schema.input), 'utf8')

                //output
                debug("local outputschema was overwritten")
                config.set("schema.output", "./env/schema/output.json")
                fs.writeFileSync("./env/schema/output.json", JSON.stringify(update.schema.output), 'utf8')
            }


        } else if (key === "info") {
            //update general Info
            await updateInfo(update[key])
            //update input/output info just if worker is in no community
            if (pathExists(update, ["schema", "input"]) || pathExists(update, ["schema", "output"]) || (!pathExists(update, ["schema"]) && config.get("schema").link === undefined)) {
                await updateInputOutputInfo(update[key])
            }
        }
        //update the rest
        else if (key !== 'id' && key !== 'apikey') {
            config.set(key, update[key])
        }
    }
    //save current status of config for viewing purposes in current.json
    fs.writeFileSync('./config/development.json', JSON.stringify(config.get(), null, 4), 'utf8')
}

let updateInfo = async function (info) {
    if (info.description !== undefined) {
        if (!fs.existsSync("./env/description")) {
            fs.mkdirSync("./env/description")
        }
        debug("Stored description in ./env/description/worker.md")
        config.set("info.description", "./env/description/worker.md")
        fs.writeFileSync("./env/description/worker.md", info.description, 'utf8')
    }
    if (info.tags !== undefined) {
        debug("Updated tags")
        config.set("info.tags", info.tags)
    }
}

let updateInputOutputInfo = async function (info) {
    if (info.hasOwnProperty("input")) {
        if (info.input.hasOwnProperty("description")) {
            if (!fs.existsSync("./env/description")) {
                fs.mkdirSync("./env/description")
            }
            debug("Stored input description in ./env/description/input.md")
            config.set("info.input.description", "./env/description/input.md")
            fs.writeFileSync("./env/description/input.md", info.input.description, 'utf8')
        }
        if (info.input.hasOwnProperty("tags")) {
            debug("Updated input tags")
            config.set("info.input" + ".tags", info.input.tags)
        }
    }
    if (info.hasOwnProperty("output")) {
        if (!fs.existsSync("./env/description")) {
            fs.mkdirSync("./env/description")
        }
        if (info.output.hasOwnProperty("description")) {
            debug("Stored output description in ./env/description/output.md")
            config.set("info.output.description", "./env/description/output.md")
            fs.writeFileSync("./env/description/output.md", info.output.description, 'utf8')
        }
        if (info.output.hasOwnProperty("tags")) {
            debug("Updated output tags")
            config.set("info.output" + ".tags", info.output.tags)
        }
    }
}


/**
 * This function checks if a given path of fieldnames exists in an object
 * @param {Object} obj - Json object 
 * @param {Array} args - fieldarray that defines which path to check
 */
let pathExists = function (obj, args) {
    if (obj === undefined) return false
    for (el of args) {
        if (!obj || !obj.hasOwnProperty(el)) {
            return false
        }
        obj = obj[el]
    }
    return true
}

module.exports = update
