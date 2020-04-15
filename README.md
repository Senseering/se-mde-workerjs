[![Build Status](https://travis-ci.com/Senseering/worker_js.svg?token=J8PZydPmZBQA3jayA6F4&branch=master)](https://travis-ci.com/Senseering/worker_js)

Client library to connect to the [edge node](https://github.com/Senseering/manager).

## Development lifecycle

Before doing a PR check your code against the linter: 

```npm run lint```

And run all tests:

```npm run test```


## Example usage
```js
let Worker = require('worker_js')

config = {
    name: 'hello_world',
    location: {
        lat: 50.7797268,
        long: 6.100391
    },
    input: './env/input_template.js',
    output: './env/output_template.js',
    apiKey: '123466',
    privKey: './env/key_world.js',
    mode: 0, 
    run: ({data, params}) => { 
        return 'Hello World'
    }
}
        
c1 = new Worker(config,'127.0.0.1:3000')

c1.init().then(() => {
    c1.run({challo: 123}, {ballo: 321}).then((res) => {
        //consol.log(res)
    }).catch((e) => {
        debug('Unexpected Error: ' + e.stack)
    })
})
```

## Worker Description
A worker is the basic building block for our approach to a decentralised data plattform. It utilizes the manager for storing, managing and selling our data on the senseering myDataEconomy-plattform. The workers objective is to process or generate data based on sensor inputs or other available feeds. It can be run as a source that only publishes data to your liking (e.g. send every few seconds the new sensor inputs) or as a service, which provides a service function that can be triggered on demand (e.g. a weather station that should only publish on demand or an image recognition service). Also a mixture of those two types is possible.
This should give a short introduction to workers and the possible use cases. Below you can find more information to the config object and the api of `worker_js`.

### Config object high level description

| Property | Type | Description |
|--------|----------|------|
| name | String | The fully qualified name by which the worker should be called | 
| location | Object | 2D GPS coordinate of the worker |
| input | String | URI reference to the input  |
| output | String | URI reference to the output |
| apiKey | String | API-Key to access the edge node |
| privKey | String | URI reference to the private key used to signing |
| mode | Number | Number to describe the options that trigger the function |
| run | Function | Function that is run when triggered |

### Worker API

#### worker.connect : 
Sets up the connection to the manager, registers the worker and generates keys
#### worker.publish :
Publishes desired data on the manager
#### worker.provide:
Provides the service function that can be triggered on demand

### Templates in workers

A detailed explanation to templates and the idea behind it can be found in the `template_js` repository. For the worker itself it is only needed to know that templates are a high level description of the exact data structure in JSON-LD Format. The incoming and outgoing data must be described in that way so every worker knows what to expect from the incoming data and is able to work on it.