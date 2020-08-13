const NodeRSA = require('node-rsa')
const debug = require('debug')('verify')
const stringify = require('fast-json-stable-stringify')

let verify = {}
/**
 * Verify string of object with the signature
 * @param {String} serializedObj An object that is serialized by the *serializeObj* function.
 * @param {String} signature The signature of the serialized object
 * @param {Object} pubkey The public key to verify signature and string
 */
verify.verifyObj = (package, key) => {
  debug('Verifying the data package of worker: ', package.meta.worker_id)
  packageClone = JSON.parse(JSON.stringify(package))
  if(typeof key === 'string')
    key = new NodeRSA(key)
  let signature = packageClone.meta.signature
  delete packageClone.meta.signature
  /* eslint-disable-next-line */
  return key.verify(stringify(packageClone), Buffer.from(signature, 'base64'))
}


verify.appendSignature = function (package, key) {
  debug('Signing the data package of worker: ', package.meta.worker_id)
  package.meta.signature = key.sign(stringify(package)).toString('base64');
  return package;
}

module.exports = verify