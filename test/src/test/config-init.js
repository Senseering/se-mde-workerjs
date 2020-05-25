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
}