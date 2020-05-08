let change = {}

change.send = async function() {
    let version = await config.getVersion()
    await client.socket.transmit('change', 'unsent', {message: version})
} 

module.exports = change