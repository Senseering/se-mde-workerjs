let config = require("../../../src/utils/config/config");

module.exports = function ({CONFIG_PATH} = {}) {
    let expect = require('chai').expect;
    it('Bad config should throw (malformed id)', async function () {
        try {
            await config.init("./test/data/badIDConfig.json")
        } catch (err) {
            expect(err).to.be.an('error');
        }
    })

    it('Bad config should throw (malformed url)', async function () {
        try {
            await config.init("./test/data/badURLConfig.json")
        } catch (err) {
            expect(err).to.be.an('error');
        }
    })

    
    it('Check if key order makes a difference', async function () {
        await config.init('./test/data/config.json')
        let configVerison = await config.version.get()
        await config.init('./test/data/config-unordered.json')
        let configVerisonUnordered = await config.version.get()
        
        for (const [index, config] of Object.entries(configVerison.split('.'))) {
            expect(config.split('@')[0]).to.equal(configVerisonUnordered.split('.')[index].split('@')[0])
        }
        
    })
}