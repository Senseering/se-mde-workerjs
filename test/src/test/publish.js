module.exports = function (data) {

    let expect = require('chai').expect;

    //define globally used data here!

    it('adding an example test', async function () {
        expect({ a: 1 }).to.deep.equal({ a: 1 })
    })


}