const { WebClient } = require('@slack/web-api');
const logger = require('./logger');

const botOAuth = process.env.BOT_OAUTH;
const logLevel = process.env.WEBCLIENT_LOG_LEVEL || 'info';

const client = new WebClient(botOAuth, {
    logLevel: logLevel
});

// TODO: Pagination!
const getUserId = async (userName) => {
    logger.debug('Getting user id for ${userName}');
    const users = await client.users.list({limit: 100});
    if(!users.ok) {
        logger.error(users.error);
        throw new Error(users.error);
    }

    const user = users.members.filter((u) => u.name === userName);
    if(user.length === 1) {
        logger.debug(`found: user[0].id`);
        return user[0].id;
    } else {
        logger.debug(`User id not found`);
        return null;
    }
}

const messageUser = (userId, channelId, message) => {
    logger.debug(`Sending espemeral message to user ${userId} in channel ${channelId}: ${JSON.stringify(message)}`)
    return client.chat.postEphemeral({
        ...message,
        user: userId,
        channel: channelId
    });
}

const isUserInChannel = async (userId, channelId) => {
    const users = await client.channels.info({channel: channelId});

    if(!users.ok) {
        throw new Error(users.error);
    }

    return users.channel.members.filter((id) => id === userId).length === 1; 
}

const postToChannel = (channelId, message) => {
    logger.debug(`sending a message to channel ${channelId}: ${JSON.stringify(message)}`)
    return client.chat.postMessage({
        ...message,
        channel: channelId
    });
}

module.exports = {
    getUserId,
    messageUser,
    isUserInChannel,
    postToChannel
}