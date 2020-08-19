let format = {}

format.input = function (received) {
    if (typeof (received) === "string") {
        received = JSON.parse(received)
    }
    return { topic: received.topic, message: received.message }
}
format.output = function (topic, message) {
    let toSend = {}
    toSend.topic = topic
    toSend.message = message
    return JSON.stringify(toSend)
}
module.exports = format