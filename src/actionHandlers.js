const db = require('./db');
const { messageUser } = require('./slack');
const Quarto = require('./quarto');

const handleChallengeBasic = {
    match: {
        actionId: 'quarto_challenge_basic'
    },
    handle: async (payload, respond) => {
        handleChallenge(payload, respond, false);
        return {
            text: 'Sending invite...'
        };
    }
}

const handleChallengeAdvanced = {
    match: {
        actionId: 'quarto_challenge_advanced'
    },
    handle: async (payload, respond) => {
        handleChallenge(payload, respond, true);
        return {
            text: 'Sending invite...'
        }
    }
}

const handleChallenge = async (payload, respond, advancedRules) => {
    const gameId = payload.actions[0].value;
    try {
        const state = await db.get(gameId);
        const [challengerId, opponentId] = state.players;
        const channelId = state.channel;

        await db.set(gameId, {
            ...state,
            accepted: false,
            advancedRules
        });

        await messageUser(opponentId, channelId, {
            blocks: [
                {
                    type: 'section',
                    text: {
                        type: 'mrkdwn',
                        text: `<@${challengerId}> would like to play a game of Quarto using ${advancedRules ? 'advanced' : 'basic'} rules.`
                    }
                },
                {
                    type: 'actions',
                    elements: [
                        {
                            type: 'button',
                            text: {
                                type: 'plain_text',
                                text: 'Accept',
                                emoji: true
                            },
                            value: gameId,
                            action_id: 'quarto_accept_challenge'
                        },
                        {
                            type: 'button',
                            text: {
                                type: 'plain_text',
                                text: 'Decline',
                                emoji: true
                            },
                            value: gameId,
                            action_id: 'quarto_decline_challenge'
                        }
                    ]
                }
            ]
        });
    } catch(e) {
        console.log(e);
        db.del(gameId);
        if(process.env.NODE_ENV === 'development') {
            return respond({text: JSON.stringify(e)});
        } else {
            return respond({
                text: 'Oops, something has gone wrong...'
            });
        }
    }

    return respond({
        text: 'Invite sent, awaiting response.'
    });
}

const handleAcceptChallenge = {
    match: {
        actionId: 'quarto_accept_challenge'
    },
    handle: async (payload, respond) => {
        acceptChallenge(payload, respond);
        return {
            text: 'Accepting...'
        };
    }
}

const acceptChallenge = async (payload, respond) => {
    const gameId = payload.actions[0].value;
    try {
        const state = await db.get(gameId);
        const [challengerId, opponentId] = state.players;
        const channelId = state.channel;

        const players = Math.random() > 0.5 ? [challengerId, opponentId] : [opponentId, challengerId];
        const challengerStarts = players[0] === challengerId;

        state.game = Quarto.newGame(players[0], players[1], state.advancedRules);

        await db.set(gameId, state);

        if(challengerStarts) {
            respond({
                text: `Alright! <@${challengerId}> will start.`
            });
        } else {
            respond({
                text: 'Alright! You get the first turn!'
            });
            messageUser(challengerId, channelId, {
                text: `<@${opponentId}> accepted your challenge and got the first turn!`
            });
        }

        getPieceOffer(gameId);
    } catch(e) {
        console.log(e);
    }
}

const handleDeclineChallenge = {
    match: {
        actionId: 'quarto_decline_challenge',
    },
    handle: async (payload, respond) => {
        declineChallenge(payload, respond);
        return {
            text: 'Cancelling...'
        };  
    }
}

const declineChallenge = async (payload, respond) => {
    const gameId = payload.actions[0].value;
    try {
        const state = await db.get(gameId);
        const [challengerId, opponentId] = state.players;
        const channelId = state.channel;

        messageUser(challengerId, channelId, {
            text: `<@${opponentId}> has declined your challenge.`
        });

        await db.del(gameId);
    } catch(e) {
        console.log(e);
        db.del(gameId);
        if(process.env.NODE_ENV === 'development') {
            return respond({text: JSON.stringify(e)});
        } else {
            return respond({
                text: 'Oops, something has gone wrong...'
            });
        }
    }

    return respond({
        text: 'Challenge declined.'
    });
}

// Todo: get this dynamically
const getGameImageURL = (game) => `https://afefd82d.ngrok.io/slackuarto/render/${game.board.map((e) => e < 0 ? '' : `${e}`).join(',')};${game.pieceOnOffer ? game.pieceOnOffer : ''}.png`;

const getPieceOffer = async (gameId) => {
    const state = await db.get(gameId);
    const { game } = state;

    console.log(getGameImageURL(game));

    try {
        await messageUser(Quarto.getActivePlayerName(game), state.channel, {
            blocks: [
                {
                    type: 'image',
                    alt_text: 'board',
                    image_url: getGameImageURL(game)
                },
                {
                    type: 'section',
                    text: {
                        type: 'plain_text',
                        text: 'Select a piece to offer...'
                    }
                },
                {
                    type: 'actions',
                    block_id: gameId,
                    elements: [
                        {
                            type: 'static_select',
                            action_id: 'quarto_select_piece',
                            options: Quarto.getRemainingPieces(game).map((e) => {
                                        const eStr = `${e}`;
                                        return {
                                            text: {
                                                type: 'plain_text',
                                                text: eStr
                                            },
                                            value: eStr
                                        }
                                    })
                        }
                    ]
                }
            ]
        });
    } catch(e) {
        console.log(e);
    }
}

const handleSelectPiece = {
    match: {
        actionId: 'quarto_select_piece'
    },
    handle: async (payload, respond) => {
        return {
            blocks: [
                {
                    type: 'section',
                    text: {
                        type: 'plain_text',
                        text: 'hello, i am replacement'
                    }
                }
            ]
        }
    }
}

module.exports = {
    handleChallengeBasic,
    handleChallengeAdvanced,
    handleAcceptChallenge,
    handleDeclineChallenge,
    handleSelectPiece
}