let config = require("../../../src/utils/config");

module.exports = function () {

    let expect = require('chai').expect;

    //define globally used data here!
    //initialize storage 
    before(async () => {
        await config.init("./test/data/config.json")
    })

    it('Test full config', async function () {
        let res = await config.get("full")
        expect(res).to.include.all.keys("profile", "settings", "schema", "privKey", "info")
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
        let res = await config.compare("test.test2.trest2.ts")
        expect(res).to.equal("1.1.1.1")
    })

    it('Test comparison with corect version', async function () {
        let res = await config.compare("2Z2M3GFJ6MfzSnMnFjOE+RX0RI+VE62C9O2EB4zD9xE=" + "." +
            "i8Rx+zeLGUATX4DiuZaXmXW1caOpt/BFg7AFhQnuDsI=" + "." +
            "s2B7Jz7m184N5/F2fVibOCT9BMhEooIeSx9r+nBf3cI=" + "." +
            "qxSxXd4M+iRKnNYRew0iplyBMSoOElGqfmJ4VpOHniM=")
        expect(res).to.equal("0.1.0.0")
    })

    it('Update profile and compare for update', async function () {
        let profile = { "name": "Example Source", "location": { "latitude": 52.5297268, "longitude": 13.400391 }, "payment": { "fixCost": 0, "isFixCostOnly": false } }
        after(async () => { 
            profile.name = "Example Source"
            await config.update("profile", profile)
        })
        profile.name = "test"
        await config.update("profile", profile)
        let res = await config.compare("2Z2M3GFJ6MfzSnMnFjOE+RX0RI+VE62C9O2EB4zD9xE=" + "." +
            "i8Rx+zeLGUATX4DiuZaXmXW1caOpt/BFg7AFhQnuDsI=" + "." +
            "s2B7Jz7m184N5/F2fVibOCT9BMhEooIeSx9r+nBf3cI=" + "." +
            "qxSxXd4M+iRKnNYRew0iplyBMSoOElGqfmJ4VpOHniM=")
        expect(res).to.equal("0.1.1.0")
    })

}

