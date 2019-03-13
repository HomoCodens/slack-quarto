const db = require('./db');
const { isUserInChannel, getUserId, messageUser } = require('./slack');
const { updateResponse, getGameId } = require('./helpers');
const screens = require('./screens');

const slashCommandHandler = async (req, res) => {
    if(req.body.command === '/quarto') {
        const tokens = req.body.text.split(' ');
        if(tokens[0] === 'challenge') {
            initiateChallenge(req);

            res.json({
                text: 'Please wait...'
            });            
        }
    }
}

const initiateChallenge = async (req) => {
    const tokens = req.body.text.split(' ');
    const opponent = tokens[1].replace(/^@/, '');
    const challengerId = req.body.user_id;
    const channelId = req.body.channel_id;
    const opponentId = await getUserId(opponent);
    const responseURL = req.body.response_url;

    if(opponentId !== null) {
        const playerIds = [challengerId, opponentId].sort();
        const gameId = getGameId(playerIds)
        const existingState = await db.get(gameId);
                
        if(existingState !== null) {
            return updateResponse(responseURL, {
                text: `There is already a game between you and <@${opponentId}> in <#${channelId}>!`
            });
        }

        const userInChannel = await isUserInChannel(opponentId, channelId);

        if(!userInChannel) {
            return updateResponse(responseURL, {
                text: 'You can only challenge users who are present in the channel!'
            });
        }

        db.set(gameId, {
            players: [challengerId, opponentId],
            channel: channelId,
            pieceOnOffer: null,
            possiblePlacement: null,
            triedForVictory: false
        });

        return updateResponse(responseURL, screens.ruleSelectionScreen(gameId));

    } else {
        return updateResponse(responseURL, {
            text: 'Could not find that user...'
        });
    }
}

module.exports = slashCommandHandler;