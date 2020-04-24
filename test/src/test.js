
const { sleep } = require("./utils/sleep")
const expected = require("../data/example.json")

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
    importTest(" adding tests ","./test/publish", expected);


    //importTest( "Reverter -  reverting changes", "./reverter/reverter.js", storage, expected); //not working
});
