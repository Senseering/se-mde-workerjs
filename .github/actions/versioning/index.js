const core = require('@actions/core');
const github = require('@actions/github');

try {
    // Get the JSON webhook payload for the event that triggered the workflow
    const payload = github.context.payload
    let size = 'patch'

    if (payload.pull_request.body.includes('patch')) {
        size = 'patch'
    } else if (payload.pull_request.body.includes('minor') || payload.pull_request.body.includes('feat') || payload.pull_request.body.includes('feature')) {
        size = 'minor'
    } else if (payload.pull_request.body.includes('major') || payload.pull_request.body.includes('breaking change') || payload.pull_request.body.includes('release')) {
        size = 'major'
    }
    return bump
} catch (error) {
    core.setFailed(error.message);
}