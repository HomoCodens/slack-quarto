const fetch = require('node-fetch');

const updateResponse = (responseUrl, message) => {
    return fetch(responseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(message)
    }).then(console.log).catch(console.log);
}

const getGameId = (...parts) => parts.sort().join('')

module.exports = {
    updateResponse,
    getGameId
}