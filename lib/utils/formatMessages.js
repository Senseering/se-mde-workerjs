let format = {}

format.input = function (message) {
    if (typeof (message) === "string") {
        message = JSON.parse(message)
    }
    let topic = message.topic
    delete message.topic
    return { topic: topic, message: message }
}
format.output = function (topic, message) {
    if (typeof (message) === "string") {
        message = JSON.parse(message)
    }
    message.topic = topic
    return JSON.stringify(message)
}
module.exports = format