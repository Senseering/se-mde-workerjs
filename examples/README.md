# The four major use cases for this library
#### The worker library has 4 major use cases which will be detailed in this example document.

The core purpose of a worker is to sign the output of one function and send it to the manager which in turn makes the output immutable by uploading the signature and other meta data to a distributed ledger. The function itself has two dimensions which partition the worker:

- _Triggerable_ : Is the function accessible from a remote location? Or can it only be run by the code itself?  
*Example* : A Weatherstation could be run every minute by running the code that producess Weatherdata every minute, but it could also run on-demand when a user needs that information. ( Hybrid solutions are also possible )  
*Usage* : Set in your config the _mode_ parameter to 0 if you want to trigger the Application by code and to 1 if you want that it also is able to be triggerd from the outside.  
- _Processing_ : Does your function need data as an input? Or is it an application that just produces data?   
*Example* : A Weatherstation just produces the data, but a service that does image recognition needs the image data as an input to the function.   
*Usage* : Just remove the _input_ parameter from the config file if you dont need the input. If you want the input create an input file that describes your desired input as close as possible with [json-schema](https://json-schema.org/).


## Examples

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