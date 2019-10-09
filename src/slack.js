const { WebClient } = require('@slack/client');

const botOAuth = process.env.BOT_OAUTH;

const client = new WebClient(botOAuth);

// TODO: Pagination!
const getUserId = async (userName) => {
    const users = await client.users.list({limit: 100});
    if(!users.ok) {
        throw new Error(users.error);
    }

    const user = users.members.filter((u) => u.name === userName);
    if(user.length === 1) {
        return user[0].id;
    } else {
        return null;
    }
}

const messageUser = (userId, channelId, message) => {
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