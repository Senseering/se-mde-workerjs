
const { sleep } = require("./utils/sleep")
const fs = require("fs").promises

//define test import function
let importTest = function (name, path, config) {
    describe(name, function () {
        require(path)(config);
    });
}

let config = require("../../src/utils/config/config");
let CONFIG_PATH = "./test/data/config.json"

describe("Testing configuration initalisation", function () {
    importTest("Check for different bad initalisations", "./test/config-init")
})

describe("Testing configuration for [Persistent File Storage]", function () {

    beforeEach(async () => {
        await config.init(CONFIG_PATH)
    })

    importTest("Testing configuration", "./test/config", {
        CONFIG_PATH
    })
})

describe("Testing configuration for [In Memory]", function () {

    before(async () => {
        // Creating a config
        let configFile = JSON.parse(await fs.readFile("./test/data/config.json", "utf-8"))
        configFile.privKey = await fs.readFile("./test/data/env/key.pem", "utf-8")
        configFile.schema.input = JSON.parse(await fs.readFile("./test/data/env/schema/input.json", "utf-8"))
        configFile.schema.output = JSON.parse(await fs.readFile("./test/data/env/schema/output.json", "utf-8"))
        configFile.info.worker.description = await fs.readFile("./test/data/env/description/worker.md", "utf-8")
        configFile.info.input.description = await fs.readFile("./test/data/env/description/input.md", "utf-8")
        configFile.info.output.description = await fs.readFile("./test/data/env/description/output.md", "utf-8")
        await config.init(configFile)
    })

    importTest("Testing configuration", "./test/config", { CONFIG_PATH })
})