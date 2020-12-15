let config = require("../../../src/utils/config/config");

module.exports = function ({CONFIG_PATH} = {}) {
    let expect = require('chai').expect;
    it('Bad config should throw (malformed id)', async function () {
        let error
        try {
            await config.init("./test/data/badIDConfig.json")
        } catch (err) {
            error = err
        }
        expect(error).to.be.an('error');
    })

    it('Bad config should throw (malformed url)', async function () {
        let error
        try {
            await config.init("./test/data/badURLConfig.json")
        } catch (err) {
            error = err
        }
        expect(error).to.be.an('error');
    })

    
    it('Bad config should throw (malformed key in custom)', async function () {
        let error
        try {
            await config.init("./test/data/wrongKeyConfig.json")
        } catch (err) {
            error = err
        }
        expect(error).to.be.an('error');
    })

    it('Should work (all keys correct in config meta)', async function () {
        let error
        try {
            await config.init("./test/data/rightKeyConfig.json")
        } catch (err) {
            error = err
        }
        expect(error).to.equal(undefined);
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