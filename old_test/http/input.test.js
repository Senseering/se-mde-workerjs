const expect = require('chai').expect
const nock = require('nock')

const input = require('../../lib/http/input')
const pullResponse = require('./input.test.pull.response')

describe('First test', () => {
    it('Should assert true to be true', () => {
        expect(true).to.be.true
    })
})

describe('Input Tests', () => {
    beforeEach(() => {
        nock('http://127.0.0.1')
          .get('/worker/pull?id=507f1f77bcf86cd799439011')
          .times(3)
          .reply(200, pullResponse)
    })
    it('Get a workers data by id',() => {
        return input.pullAll(['507f1f77bcf86cd799439011'], 'http://127.0.0.1')
                .then( (res) => {
                    expect(res[0]).to.eql(pullResponse)
                })
    })
    it('Get multiple workers data by id',() => {
        return input.pullAll(['507f1f77bcf86cd799439011','507f1f77bcf86cd799439011','507f1f77bcf86cd799439011'], 'http://127.0.0.1')
                .then( (res) => {
                    expect(res[0]).to.eql(pullResponse)
                    expect(res[1]).to.eql(pullResponse)
                    expect(res[2]).to.eql(pullResponse)
                })
    })
})