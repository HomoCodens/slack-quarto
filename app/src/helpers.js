const fetch = require('node-fetch');
const logger = require('./logger');

const updateResponse = (responseUrl, message) => {
    logger.debug(`updating response ${responseUrl} to ${JSON.stringify(message)}`);
    return fetch(responseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(message)
    }).then(logger.debug).catch(logger.error);
}

const getGameId = (...parts) => parts.sort().join('')

module.exports = {
    updateResponse,
    getGameId
}