let verify = require("../../../src/utils/verify");
let config = require("../../../src/utils/config/config");
const NodeRSA = require('node-rsa')

module.exports = function () {
    let expect = require('chai').expect;
    it('Test normal obj', async function () {
        let package = verify.appendSignature({
            meta: {
                worker_id: '6de83f90-dc6b-11ea-9df9-41d7ebc8b29a',
                created_at: 1597220616529,
                price: 0,
                location: { latitude: 13.5297268, longitude: 13.400391 },
                custom: { hello: 67 }
            },
            data: {
                force: 1808.9174754919422,
                volume: 64.92776665970422,
                ppm: 19.389278384819203
            }
        }, new NodeRSA(await config.get('privKey')))
        expect(package.meta.signature).to.equal("K3YaDeV63q1zYskjnBvwWPyEbyKTUFOn/tSe6558CpoPKITyToqmoSB4uWzYekgk1Cge8fr5JnyFWxQqBaHCJfjFBosmbF2AzqXI8xGxvzz+UNgpxPo+odQ76l7eRdM5k1aK24/D/OsB19WgJDKoGpLlF7t28BuMIZAcmrcI9OA=")
    })


    it('Test ordering of signatures', async function () {

        let package = verify.appendSignature({
            meta: {
                worker_id: '6de83f90-dc6b-11ea-9df9-41d7ebc8b29a',
                created_at: 1597220616529,
                price: 0,
                location: { latitude: 13.5297268, longitude: 13.400391 },
                custom: { hello: 67 }
            },
            data: {
                force: 1808.9174754919422,
                volume: 64.92776665970422,
                ppm: 19.389278384819203
            }
        }, new NodeRSA(await config.get('privKey')))


        let packageDiffOrder = verify.appendSignature({
            meta: {
                created_at: 1597220616529,
                worker_id: '6de83f90-dc6b-11ea-9df9-41d7ebc8b29a',
                custom: { hello: 67 },
                price: 0,
                location: { latitude: 13.5297268, longitude: 13.400391 },
            },
            data: {
                force: 1808.9174754919422,
                volume: 64.92776665970422,
                ppm: 19.389278384819203
            }
        }, new NodeRSA(await config.get('privKey')))
        expect(package.meta.signature).to.equal(packageDiffOrder.meta.signature)
    })

    it('Test date object (complex obj)', async function () {
        let package = verify.appendSignature({
            meta: {
                worker_id: '6de83f90-dc6b-11ea-9df9-41d7ebc8b29a',
                created_at: 1597220616529,
                price: 0,
                location: { latitude: 13.5297268, longitude: 13.400391 },
                custom: { hello: 67 }
            },
            data: {
                date: new Date(),
            }
        }, new NodeRSA(await config.get('privKey')))
        expect(package.meta.signature).to.exist
    })

    it('Throw on circular obj', async function () {
        a = {}; a.a = a;
        try {
            verify.appendSignature({
                meta: {
                    worker_id: '6de83f90-dc6b-11ea-9df9-41d7ebc8b29a',
                    created_at: 1597220616529,
                    price: 0,
                    location: { latitude: 13.5297268, longitude: 13.400391 },
                    custom: { hello: 67 }
                },
                data: {
                    test: a,
                }
            }, new NodeRSA(await config.get('privKey')))
        } catch (err) {
            expect(err.message).to.equal("Converting circular structure to JSON")
        }
    })

    it('Test verification of valid signatuer', async function () {
        let test = {
            meta: {
                worker_id: '6de83f90-dc6b-11ea-9df9-41d7ebc8b29a',
                created_at: 1597220616529,
                price: 0,
                location: { latitude: 13.5297268, longitude: 13.400391 },
                custom: { hello: 67 }
            },
            data: {
                force: 1808.9174754919422,
                volume: 64.92776665970422,
                ppm: 19.389278384819203
            }
        }
        let package = verify.appendSignature(test, new NodeRSA(await config.get('privKey')))
        let pubkey = (new NodeRSA(await config.get('privKey'))).exportKey('public')
        let result = verify.verifyObj(package, pubkey)
        expect(result).to.equal(true)
    })


    it('Test verification of invalid signatuer', async function () {
        let test = {
            meta: {
                worker_id: '6de83f90-dc6b-11ea-9df9-41d7ebc8b29a',
                created_at: 1597220616529,
                price: 0,
                location: { latitude: 13.5297268, longitude: 13.400391 },
                custom: { hello: 67 }
            },
            data: {
                force: 1808.9174754919422,
                volume: 64.92776665970422,
                ppm: 19.389278384819203
            }
        }
        let package = verify.appendSignature(test, new NodeRSA(await config.get('privKey')))
        package.meta.signature = "a"
        let pubkey = (new NodeRSA(await config.get('privKey'))).exportKey('public')
        let result = verify.verifyObj(package, pubkey)
        expect(result).to.equal(false)
    })
}