'use strict'
const debug = require('debug')('index')
let config  = require("./src/utils/config");

(async () => {
    debug("1.1.1.1")
    await config.init()
    let res = await config.get("full")
    //debug(res)
    let res2 = await config.get("privKey")
    //debug(res2)
    let res3 = await config.compare("test.test2.trest2.ts")
    debug(res3)
    let res4 = await config.compare("2Z2M3GFJ6MfzSnMnFjOE+RX0RI+VE62C9O2EB4zD9xE=" + "." +
    "i8Rx+zeLGUATX4DiuZaXmXW1caOpt/BFg7AFhQnuDsI=" + "." +
    "s2B7Jz7m184N5/F2fVibOCT9BMhEooIeSx9r+nBf3cI=" + "." +
    "qxSxXd4M+iRKnNYRew0iplyBMSoOElGqfmJ4VpOHniM=")
    debug(res4)
    res.profile.name = "Other Test"
    await config.update("profile", res.profile)
    let res6 = await config.compare("2Z2M3GFJ6MfzSnMnFjOE+RX0RI+VE62C9O2EB4zD9xE=" + "." +
    "i8Rx+zeLGUATX4DiuZaXmXW1caOpt/BFg7AFhQnuDsI=" + "." +
    "s2B7Jz7m184N5/F2fVibOCT9BMhEooIeSx9r+nBf3cI=" + "." +
    "qxSxXd4M+iRKnNYRew0iplyBMSoOElGqfmJ4VpOHniM=")
    debug(res6)
    res.profile.name = "Example Source"
    await config.update("profile", res.profile)
    let res7 = await config.compare("2Z2M3GFJ6MfzSnMnFjOE+RX0RI+VE62C9O2EB4zD9xE=" + "." +
    "i8Rx+zeLGUATX4DiuZaXmXW1caOpt/BFg7AFhQnuDsI=" + "." +
    "s2B7Jz7m184N5/F2fVibOCT9BMhEooIeSx9r+nBf3cI=" + "." +
    "qxSxXd4M+iRKnNYRew0iplyBMSoOElGqfmJ4VpOHniM=")
    debug(res7)
})()

//module.exports = require('./src/worker')