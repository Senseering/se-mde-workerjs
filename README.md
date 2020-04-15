[![Build Status](https://travis-ci.com/Senseering/worker_js.svg?token=J8PZydPmZBQA3jayA6F4&branch=master)](https://travis-ci.com/Senseering/worker_js)

Client library to connect to the [edge node](https://github.com/Senseering/manager).

## Development lifecycle

Before doing a PR check your code against the linter: 

```npm run lint```

And run all tests:

```npm run test```


## Example usage
```js
let Worker = require('../../src/worker')

let config = './config/development.json'

let worker = new Worker(config);

(async function () {
    await worker.connect()

    let data = { test: 'Hello world!' }
    await worker.publish({ data: data, price: 0 })
})();
```

## Worker Description
A worker is the basic building block for our approach to a decentralised data plattform. It utilizes the manager for storing, managing and selling our data on the senseering myDataEconomy-plattform. The workers objective is to process or generate data based on sensor inputs or other available feeds. It can be run as a source that only publishes data to your liking (e.g. send every few seconds the new sensor inputs) or as a service, which provides a service function that can be triggered on demand (e.g. a weather station that should only publish on demand or an image recognition service). Also a mixture of those two types is possible.
This should give a short introduction to workers and the possible use cases. Below you can find more information to the config object and the api of `worker_js`.

### Config object high level description

| Property | Subproperty | Type | Description |
|--------|--------|----------|------|
| id |  | String | Identifier for connection to manager |
| name |  | String  | The fully qualified name by which the worker should be called | 
| location |  | Object | 2D GPS coordinate of the worker |
|  | latitude | Number | Latitude of worker location |
|  | longitude | Number | Longitude of worker location |
| payment |  | Object | Fixed price and boolean option for additional pricing |
|  | fixCost | Integer | Fixed costs of the data packages |
|  | isFixCostOnly | Boolean | Can additional costs apply? |
| schema |  | Object | Either single or community schema and boolean option for schema check on worker |
|  | input | String | URI reference to the input schema in .json format |
|  | output | String | URI reference to the output schema in .json format |
|  | check | Boolean | Is the data checked against the schema by the worker itself? |
| signature |  | Boolean | Is the data signed by the worker |
| apikey |  | String  | API-Key to access the manager |
| privKey |  | String  | URI reference to the private key used to signing |
| apiDomain |  | String | Domain of manager |
| port |  | String | port on which to connect to manager |
| protocol |  | String | http or https |
| info |  | Object | object containing all relevant information |
|  | description | String | URI reference to the info in .md format |
|  | tags | Array | tags under which this worker wnats to be found |
|  | input | String | URI reference to the input info in .md format |
|  | output | String | URI reference to the output info in .md format |

### Worker API

#### worker.connect : 
Sets up the connection to the manager, registers the worker and generates keys
#### worker.publish :
Publishes desired data on the manager
#### worker.provide:
Provides the service function that can be triggered on demand

### Templates in workers

A detailed explanation to templates and the idea behind it can be found in the `template_js` repository. For the worker itself it is only needed to know that templates are a high level description of the exact data structure in JSON-LD Format. The incoming and outgoing data must be described in that way so every worker knows what to expect from the incoming data and is able to work on it.