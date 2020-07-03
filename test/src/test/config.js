const fs = require('fs').promises
let config = require("../../../src/utils/config/config");
const { worker } = require('cluster');


module.exports = function ({ CONFIG_PATH } = {}) {
    let expect = require('chai').expect;

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
        let res = await config.version.compare("test@200000000000000000.test2@200000000000000000.trest2@200000000000000000.ts@200000000000000000")
        expect(res).to.equal("1.1.1.1")
    })

    it('Test comparison with correct version & without timestamp', async function () {
        let res = await config.version.compare("2Z2M3GFJ6MfzSnMnFjOE+RX0RI+VE62C9O2EB4zD9xE=." +
            "fvPRSm1EDCPeIrw9qaanppdW3L/Eb2V5Dxc7/mH0rP8=." +
            "VQeu2MgSOLu34V4Kjbxu0A1+Gd0f7VWtHPWx+IbkvO8=." +
            "qxSxXd4M+iRKnNYRew0iplyBMSoOElGqfmJ4VpOHniM=." +
            "6IwsTmsYTop89NViiVKu/BSM/6H7myb3sR691R35L+Q=." +
            "9u0Sz94te0sjlwG+9k3Hb2qkLoNg2DqQRzTpOecAcPQ=")
        expect(res).to.equal("0.0.0.0.0.0")
    })

    it('Update profile and compare for update', async function () {
        let profile = { "name": "Example Source", "location": { "latitude": 52.5297268, "longitude": 13.400391 } }
        profile.name = "tests" // Set profile to different version

        await config.update("profile", profile)
        let res = await config.version.compare("2Z2M3GFJ6MfzSnMnFjOE+RX0RI+VE62C9O2EB4zD9xE=@1588256356160." +
            "fvPRSm1EDCPeIrw9qaanppdW3L/Eb2V5Dxc7/mH0rP8=@1588256356160." +
            "VQeu2MgSOLu34V4Kjbxu0A1+Gd0f7VWtHPWx+IbkvO8=@1588256356160." +
            "qxSxXd4M+iRKnNYRew0iplyBMSoOElGqfmJ4VpOHniM=@1588256356160." +
            "6IwsTmsYTop89NViiVKu/BSM/6H7myb3sR691R35L+Q=@1588256356160." +
            "9u0Sz94te0sjlwG+9k3Hb2qkLoNg2DqQRzTpOecAcPQ=@1588256356160")
        expect(res).to.equal("0.0.-1.0.0.0") // The manager should update his version of the file because ours is newer
        profile.name = "Example Source"
        await config.update("profile", profile) // Revert changes 
    })

    it('Check getVersion for correct result', async function () {
        let res = await config.version.get()

        expect(res).to.equal("2Z2M3GFJ6MfzSnMnFjOE+RX0RI+VE62C9O2EB4zD9xE=@" + parseInt(res.split(".")[0].split("@")[1]) + "." +
            "fvPRSm1EDCPeIrw9qaanppdW3L/Eb2V5Dxc7/mH0rP8=@" + parseInt(res.split(".")[1].split("@")[1]) + "." +
            "VQeu2MgSOLu34V4Kjbxu0A1+Gd0f7VWtHPWx+IbkvO8=@" + parseInt(res.split(".")[2].split("@")[1]) + "." +
            "qxSxXd4M+iRKnNYRew0iplyBMSoOElGqfmJ4VpOHniM=@" + parseInt(res.split(".")[3].split("@")[1]) + "." +
            "6IwsTmsYTop89NViiVKu/BSM/6H7myb3sR691R35L+Q=@" + parseInt(res.split(".")[4].split("@")[1]) + "." +
            "9u0Sz94te0sjlwG+9k3Hb2qkLoNg2DqQRzTpOecAcPQ=@" + parseInt(res.split(".")[5].split("@")[1]))

        res.split(".").forEach((timestampString) => {
            let timestamp = parseInt(timestampString.split("@")[1])
            let date = new Date(timestamp)
            expect(date > new Date(1589969549193)).to.be.true // Be older then some arbitary date in the past and be no invalid date
        })
    })

    it('Update profile with wrong config and throw', async function () {
        let profile = { "name": "Example Source", "location": { "latitude": "52.5297268", "longitude": 13.400391 }, "payment": { "fixCost": 0, "isFixCostOnly": false } }
        try {
            await config.update("profile", profile)
        } catch (err) {
            expect(err).to.be.an('error');
        }
    })

    it('Delete worker description and check if it is auto-replaced', async function () {
        await fs.unlink('./test/data/env/description/worker.md')
        await config.init(CONFIG_PATH)
        let configInfo = await config.get('info')
        await fs.copyFile('./test/data/env/description/input.md', './test/data/env/description/worker.md')
        expect(configInfo.worker.description).to.equal('')
    })
}

