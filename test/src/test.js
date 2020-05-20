
const { sleep } = require("./utils/sleep")

//define test import function
let importTest = function (name, path, config) {
    describe(name, function () {
        require(path)(config);
    });
}

let config = require("../../src/utils/config");
let CONFIG_PATH = "./test/data/config.json"

describe("Testing configuration initalisation", function () {
    importTest("Check for different bad initalisations","./test/config-init")
})

describe("Testing configuration for [Persistent File Storage]", function () {

    beforeEach(async () => {
        await config.init(CONFIG_PATH)
    })

    importTest("Testing configuration","./test/config", {
        CONFIG_PATH
    })
})


describe("Testing configuration for [In Memory]", function () {

    before(async () => {
        await config.init(CONFIG_PATH)
    })

    importTest("Testing configuration","./test/config", {CONFIG_PATH})
})