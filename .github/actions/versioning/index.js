const core = require('@actions/core');
const github = require('@actions/github');
const fs = require('fs')

try {
    // Get the JSON webhook payload for the event that triggered the workflow
    const payload = github.context.payload
    let package = JSON.parse(fs.readFileSync('./package.json', 'utf-8'))
    let lock = JSON.parse(fs.readFileSync('./package-lock.json', 'utf-8'))
    let current_version = core.getInput('current')
    let new_version = current_version.split('.')
    let size = 'patch'

    if (payload.pull_request.body.includes('patch')) {
        size = 'patch'
        new_version[2]++
    } else if (payload.pull_request.body.includes('minor') || payload.pull_request.body.includes('feat') || payload.pull_request.body.includes('feature')) {
        size = 'minor'
        new_version[1]++
        new_version[2] = 0
    } else if (payload.pull_request.body.includes('major') || payload.pull_request.body.includes('breaking change') || payload.pull_request.body.includes('release')) {
        size = 'major'
        new_version[0]++
        new_version[1] = 0
        new_version[2] = 0
    }

    let commit_needed = package.version === new_version.join('.') ? 0 : 1
    if (commit_needed) {
        package.version = new_version.join('.')
        lock.version = new_version.join('.')
        fs.writeFileSync('./package.json', JSON.stringify(package, null, 4))
        fs.writeFileSync('./package-lock.json', JSON.stringify(lock, null, 4))
    }

    core.setOutput('size', size)
    core.setOutput('version', 'v' + package.version)
    core.setOutput('commit_needed', commit_needed)
} catch (error) {
    core.setFailed(error.message)
}