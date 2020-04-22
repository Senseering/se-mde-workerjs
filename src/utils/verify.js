const NodeRSA = require('node-rsa')
const debug = require('debug')('verify')

let verify = {}
/**
 * Serializes an object
 * @param {Object} o Object to be serialized
 * @param {String} s Temporary string *leave empty* TODO: Transfer to a non recursive function *serialize* without recursive call
 */
verify.serializeObj = (o, s = '') => {
  let keys = []
  for (let key in o) {
    if (o.hasOwnProperty(key)) {
      keys.push(key)
    }
  }
  if (!Array.isArray(o)) {
    keys.sort()
  }
  keys.forEach(element => {
    if (typeof (o[element]) === 'string') {
      s += element + o[element]
    } else if (o[element] === null) {
      s += element + 'null'
    } else if (typeof (o[element]) === 'object') {
      s += element + verify.serializeObj(o[element], '')[1]
    } else if (typeof (o[element]) === 'boolean') {
      s += element + o[element]
    } else if (typeof (o[element]) === 'number') {
      s += element + Number.parseFloat(o[element]).toFixed(4)
    } else if (undefined === o[element]) {
      s += element + 'undefined'
    } else {
      throw new Error('Unexpected Case please provide JSON to Admin ( Did you use a function or symbol? )')
    }
  })
  return [o, s]
}
/**
 * Verify string of object with the signature
 * @param {String} serializedObj An object that is serialized by the *serializeObj* function.
 * @param {String} signature The signature of the serialized object
 * @param {Object} pubkey The public key to verify signature and string
 */
verify.verifyObj = (serializedObj, signature, pubkey) => {
  debug("Verify object with signature: " + signature)
  const key = new NodeRSA(pubkey)
  /* eslint-disable-next-line */
  return key.verify(serializedObj, Buffer.from(signature, 'base64'))
}


verify.appendSignature = function (package, key) {
  debug('Signing the data package of worker: ', package.meta.worker_id)
  let signatureRelevantData = {
    meta: {
      worker_id: package.meta.worker_id,
      location: package.meta.location,
      created_at: package.meta.created_at,
      price: package.meta.price
    },
    data: package.data
  }

  //append basedOn if it is available
  package.meta.basedOn ? signatureRelevantData.meta.basedOn = package.meta.basedOn : ""

  //append signatrue to meta
  let serializedObj = verify.serializeObj(signatureRelevantData);
  package.meta.signature = key.sign(serializedObj[1]).toString('base64');
  return package;
}

module.exports = verify