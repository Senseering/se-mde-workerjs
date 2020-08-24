![Node.js Tests](https://github.com/Senseering/worker_js/workflows/Node.js%20CI/badge.svg)

Client library to connect to the [manager](https://github.com/Senseering/manager).

## Development lifecycle

Before doing a PR check your code against the linter: 

```npm run lint```

And run all tests:

```npm run test```


## Example usage
```js
let Worker = require('@senseering/worker')

let config = './config.json'

let worker = new Worker();

(async function () {
    await worker.connect(config)

    let data = { test: 'Hello world!' }
    await worker.publish(data, options: {price: 0})
})();
```

## Worker Description
A worker is the basic building block for our approach to a decentralised data plattform. It utilizes the manager for storing, managing and selling our data on the senseering myDataEconomy-plattform. The workers objective is to process or generate data based on sensor inputs or other available feeds. It can be run as a source that only publishes data to your liking (e.g. send every few seconds the new sensor inputs) or as a service, which provides a service function that can be triggered on demand (e.g. a weather station that should only publish on demand or an image recognition service). Also a mixture of those two types is possible.
This should give a short introduction to workers and the possible use cases. Below you can find more information to the config object and the api of `worker_js`.

### Config object high level description

| Property | Subproperty |  | Type | Description |
|--------|--------|----------|------|------|
| credentials |  |  | String | Identifier for connection to manager in format '<id>:<apikey>' |
| url |  |  | String | Protocol and domain of manager |
| settings |  |  | Object | Some general settings on the worker's behaviour |
|  | qualityOfService |  | Number | 0: receive at most once, 1: receive at least once |
|  | messageRetries |  | Number | Number of tries for sending of messages |
|  | messageTimeout |  | Number | Number of milliseconds to wait until timeout of message |
| meta |  |  | Object | with key-value-pairs, meta field can be added to the data packages of this worker |
| payment |  |  | Object | Fixed price and boolean option for additional pricing |
|  | fixCost |  | Integer | Fixed costs of the data packages |
|  | isFixCostOnly |  | Boolean | Can additional costs apply? |
| profile |  |  | Object | General information on worker |
|  | name |  | String  | The fully qualified name by which the worker should be called | 
|  | location |  | Object | 2D GPS coordinate of the worker |
|  |  | latitude | Number | Latitude of worker location |
|  |  | longitude | Number | Longitude of worker location |
| privKey |  | String  | URI reference to the private key used to signing |
| schema |  | Object | Either single or community schema and boolean option for schema check on worker |
|  | input | String | URI reference to the input schema in .json format |
|  | output | String | URI reference to the output schema in .json format |
| info |  |  | Object | object containing all relevant information |
|  | worker |  | Object | information for worker |
|  |  | description | String | URI reference to the worker info in .md format |
|  |  | tags | Array | tags under which this worker wants to be found |
|  | input |  | Object | information for input data |
|  |  | description | String | URI reference to the input info in .md format |
|  |  | tags | Array | tags under which this worker wants to be found |
|  | output |  | Object | information for output data |
|  |  | description | String | URI reference to the output info in .md format |
|  |  | tags | Array | tags under which this worker wants to be found |

### Worker API

#### worker.connect:
##### config (object): The config object of the worker
Sets up the connection to the manager, registers the worker and generates keys.
#### worker.publish:
##### data (object): Object that will be published
Publishes desired data on the manager
#### worker.provide:
##### service (function): function that returns data
Provides the service function that can be triggered on demand
#### worker.settings.get:
##### No parameters
Returns the current settings of the connection to the manager
#### worker.settings.update:
##### settings (object): New settings object for worker
Updates the settings of the connection of the worker to the manager
(First use worker.settings.get and modify the resulting object, before handing it to worker.settings.update)
#### worker.meta.get:
##### No parameters
Returns the currently used meta data that are added to each published data point
#### worker.meta.update:
##### meta (object): New meta data object that will be added to each data point before publication
Updates the meta data
#### worker.disconnect:
##### No parameters
Stops the connection to the manager

### Templates in workers

A detailed explanation to templates and the idea behind it can be found in the `template_js` repository. For the worker itself it is only needed to know that templates are a high level description of the exact data structure in JSON-LD Format. The incoming and outgoing data must be described in that way so every worker knows what to expect from the incoming data and is able to work on it.
