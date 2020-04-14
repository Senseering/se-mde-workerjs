[![Build Status](https://travis-ci.com/Senseering/worker_js.svg?token=J8PZydPmZBQA3jayA6F4&branch=master)](https://travis-ci.com/Senseering/worker_js)

Client library to connect to the [edge node](https://github.com/Senseering/edge_node_js).

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
A worker is the basic building block for our approach to a decentralised data plattform. It utilizes the edge node for storing, managing and selling our data on the senseering plattform. The workers objectiv is to process or generate data based on sensor inputs or other available feeds. It can be run in a *local* mode or a *remote* mode. *Local* mode is especially interesting if you want to create a data stream (e.g. send every few seconds the new sensor inputs) or you need the results of your data in another application in real time and dont want to wait on the edge node making the data available for you. *Remote* mode on the other hand is interesting if you want to data only if some user requests it (e.g. a weather station that should only publish on demand) or if you want to process data from other data sources (e.g. image recognition service or similar).

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

#### worker.init : 
Registeres the worker on the edge node, generates Keys and initalizes the different properties of the worker.
#### worker.run :
Runs the internal function. You can pass the input and params as parameters to this function.

### Templates in workers

A detailed explanation to templates and the idea behind it can be found in the `template_js` repository. For the worker itself it is only needed to know that templates are a high level description of the exact data structure in JSON-LD Format. The incoming and outgoing data must be described in that way so every worker knows what to expect from the incoming data and is able to work on it.