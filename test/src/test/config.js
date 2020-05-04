let config = require("../../../src/utils/config");
const fs = require("fs").promises
let CONFIG_PATH = "./test/data/config.json"

module.exports = function () {

    let expect = require('chai').expect;
    beforeEach(async () => {
        await config.init(CONFIG_PATH)
    })

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

    it('Test load full config', async function () {
        let res = await config.get("full")
        expect(res).to.include.all.keys("profile", "settings", "schema", "privKey", "info", "credentials", "url", "payment")
        expect(res.profile.name).to.equal("Example Source")
    })

    it('Test correct return of private key', async function () {
        let res = await config.get("privKey")
        expect(res).to.equal('-----BEGIN RSA PRIVATE KEY-----\n' +
            'MIICXwIBAAKBgQCpkBlavsbb9RLRm+dBeHI6MyAAC7bN55RDIUQm9iblSk/gDAil\n' +
            'yDR58E9JV+MlT50wFZQgQ1PF0Mqsoha7tID60rup5F5RGU+SII3ZBeE+qTLlgccY\n' +
            'Jso57OiMPA/ff3Vo86J1KuO6r57i+7e/YhRx+sgrWAx55q3bNGV9bOOtoQIDAQAB\n' +
            'AoGBAKV+OwDSioxL2Z4zJ7ZCtFoRY/4ncLfueko6waW1Qakwqlzl4drMWEtbPEc9\n' +
            'PDlCRwyTQwtqKu07J1TurnltZyPL9g1gPm0wslZqZh9mJrqZvYO/ygYYHVonuLBv\n' +
            'hXYQ2RpRmfSBff2l3RCiEg1pMGrPF2J+z5TssXwELymRuI1BAkEA8p0RCRwT+aox\n' +
            'gUGAe3EnFA+Ad85aRIpsheTY7roBE1VUJqZNGwRy8s9Dfya8M4P/mXxsSpvM+25D\n' +
            'Lu90R85dlQJBALLrL9QGAdRr7LbQNHB6jxqa2REnEHMd7yk9hjhKwJKEq057EURz\n' +
            'p7ZM7nZkadWsyGHlO/pddzlAKtVPLMLoVN0CQQDRc54YckAgg7k3cNg+OeLV48gy\n' +
            'Jlkx4RttwLMz7istiLYco+ffUkj2rM8Fv+gsxWFuHcfT5Yvi6T9hDuMhdty9AkEA\n' +
            'sAWp/FIcoru7GvAjZzVsbKRDQhjImjis/knFLsR8SKm1T3TMPCf8q+FsCZYoeUuP\n' +
            'qKA6LcqebPiwK0PFqcuhEQJBAMM6TBq9N2qBGWYaGPTcplPYRht7skCbyJMb861u\n' +
            'iEl9LioGM3uAaAkm0LTOEU9dHuxVwdyxT5JRzeplm21k8Sc=\n' +
            '-----END RSA PRIVATE KEY-----')
    })

    it('Test comparison with rubish version', async function () {
        let res = await config.compare("test@200000000000000000.test2@200000000000000000.trest2@200000000000000000.ts@200000000000000000")
        expect(res).to.equal("1.1.1.1")
    })

    it('Test comparison with corect version & without timestamp', async function () {
        let res = await config.compare("2Z2M3GFJ6MfzSnMnFjOE+RX0RI+VE62C9O2EB4zD9xE=" + "." +
            "Y8DlQawRYn8MmAjCUuL54lFWDNojIG2EWiMd0jF3qbs=" + "." +
            "VQeu2MgSOLu34V4Kjbxu0A1+Gd0f7VWtHPWx+IbkvO8=" + "." +
            "A3Yy7ktfY8fJ8rXN7WTuIsSfC4TDNPWH4kb+LEerq2I=." +
            "RBNvo1WzZ4oRRq0W9+hknpT7T8If536DEMBg9hyq/4o=")
        expect(res).to.equal("0.0.0.0.0")
    })

    it('Update profile and compare for update', async function () {
        let profile = { "name": "Example Source", "location": { "latitude": 52.5297268, "longitude": 13.400391 } }
        profile.name = "tests"
        
        let verison = await config.getVersion()
        await config.update("profile", profile)
        let res = await config.compare("2Z2M3GFJ6MfzSnMnFjOE+RX0RI+VE62C9O2EB4zD9xE=@1588256356160." +
        "Y8DlQawRYn8MmAjCUuL54lFWDNojIG2EWiMd0jF3qbs=@1588256356160." +
        "VQeu2MgSOLu34V4Kjbxu0A1+Gd0f7VWtHPWx+IbkvO8=@1588256356160." +
        "A3Yy7ktfY8fJ8rXN7WTuIsSfC4TDNPWH4kb+LEerq2I=@1588256356160." +
        "RBNvo1WzZ4oRRq0W9+hknpT7T8If536DEMBg9hyq/4o=@1588256356160")
        expect(res).to.equal("0.0.-1.0.0")
        profile.name = "Example Source"
        await config.update("profile", profile)
    })

    it('Check getVersion for correct result', async function () {
        let res = await config.getVersion()

        expect(res).to.equal("2Z2M3GFJ6MfzSnMnFjOE+RX0RI+VE62C9O2EB4zD9xE=@" + parseInt((await fs.lstat(CONFIG_PATH)).mtimeMs) + "." +
            "Y8DlQawRYn8MmAjCUuL54lFWDNojIG2EWiMd0jF3qbs=@" + parseInt((await fs.lstat(CONFIG_PATH)).mtimeMs) + "." +
            "VQeu2MgSOLu34V4Kjbxu0A1+Gd0f7VWtHPWx+IbkvO8=@" + parseInt((await fs.lstat(CONFIG_PATH)).mtimeMs) + "." +
            "A3Yy7ktfY8fJ8rXN7WTuIsSfC4TDNPWH4kb+LEerq2I=@" + parseInt((await fs.lstat(CONFIG_PATH)).mtimeMs) + "." +
            "RBNvo1WzZ4oRRq0W9+hknpT7T8If536DEMBg9hyq/4o=@" + parseInt((await fs.lstat(CONFIG_PATH)).mtimeMs))
    })

    it('Update profile with wrong config and throw', async function () {
        let profile = { "name": "Example Source", "location": { "latitude": "52.5297268", "longitude": 13.400391 }, "payment": { "fixCost": 0, "isFixCostOnly": false } }
        try {
            await config.update("profile", profile)
        } catch (err) {
            expect(err).to.be.an('error');
        }
    })
}

