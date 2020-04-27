
const { sleep } = require("./utils/sleep")

//define test import function
let importTest = function (name, path, data) {
    describe(name, function () {
        require(path)(data);
    });
}


describe("Startet testing all manager functions ", function () {

    //initialize storage 
    before(async () => {
        //doSometing
    })

    //add your tests here!
    importTest("Testing configuration","./test/config");


    //importTest( "Reverter -  reverting changes", "./reverter/reverter.js", storage, expected); //not working
});
