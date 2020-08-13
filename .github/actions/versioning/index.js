const core = require('@actions/core');
const github = require('@actions/github');
const fs = require('fs')

try {
    // Get the JSON webhook payload for the event that triggered the workflow
    const payload = github.context.payload
    console.log('The event payload: ' + JSON.stringify(payload, undefined, 2));
    let package = JSON.parse(fs.readFileSync('./package.json', 'utf-8'))
    console.log('The pacakge.json in current branch: ' + JSON.stringify(package, undefined, 2));
    let current_version = core.getInput('current')
    let size = 'patch'

    if (payload.pull_request.body.includes('patch')) {
        size = 'patch'
    } else if (payload.pull_request.body.includes('minor') || payload.pull_request.body.includes('feat') || payload.pull_request.body.includes('feature')) {
        size = 'minor'
    } else if (payload.pull_request.body.includes('major') || payload.pull_request.body.includes('breaking change') || payload.pull_request.body.includes('release')) {
        size = 'major'
    }

    core.setOutput('size', size)
} catch (error) {
    core.setFailed(error.message);
}