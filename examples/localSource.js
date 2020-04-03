let Component = require('worker_js')

helloWorld = new Component();

(async function(){
    await helloWorld.init(() => {
        return {
            text : "Hello world"
        }
    })

    await helloWorld.run()
})();