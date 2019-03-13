const db = require('./db');
const { messageUser, postToChannel } = require('./slack');
const Quarto = require('./quarto');
const screens = require('./screens');

const stateSwitchPlayers = (state) => {
    state.pieceOnOffer = null;
    state.possiblePlacement = null;
    state.triedForVictory = false;

    return state;
}

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

        const newState = {
            ...state,
            accepted: false,
            advancedRules
        };

        await db.set(gameId, newState);

        await messageUser(opponentId, channelId, screens.challengeScreen(gameId, newState));
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

const getPieceOffer = async (gameId) => {
    const state = await db.get(gameId);
    const { game } = state;

    try {
        await messageUser(Quarto.getActivePlayerName(game), state.channel, screens.pieceSelection(gameId, state));
    } catch(e) {
        console.log(e);
    }
}

const handleSelectPiece = {
    match: {
        actionId: 'quarto_select_piece'
    },
    handle: async (payload, respond) => {
        const gameId = payload.actions[0].block_id;
        const selectedPiece = +payload.actions[0].selected_option.value;

        const state = await db.get(gameId);
        state.pieceOnOffer = selectedPiece;
        await db.set(gameId, state);

        respond(screens.pieceSelection(gameId, state));
    }
}

const handleOfferPiece = {
    match: {
        actionId: 'quarto_offer_piece'
    },
    handle: async (payload, respond) => {
        try{
            console.log(payload);
            const gameId = payload.actions[0].value;
            let state = await db.get(gameId);
            let { game } = state;

            state.game = Quarto.play(game, {
                player: Quarto.getActivePlayerName(game),
                type: 'OFFER_PIECE',
                data: state.pieceOnOffer
            });

            state = stateSwitchPlayers(state);

            await db.set(gameId, state);

            await postToChannel(state.channel, screens.turnSummary(state));

            await messageUser(Quarto.getActivePlayerName(state.game), state.channel, screens.piecePlacement(gameId, state));

            respond({
                text: `It's now their turn.`
            });
        } catch(e) {
            console.log(e);
        }
    }
}

const handleSelectPlacement = {
    match: {
        actionId: 'quarto_select_placement'
    },
    handle: async (payload, respond) => {
        const gameId = payload.actions[0].block_id;
        let state = await db.get(gameId);

        state.possiblePlacement = payload.actions[0].selected_option.value;

        await db.set(gameId, state);

        respond(screens.piecePlacement(gameId, state));
    }
}

const handlePlacement = {
    match: {
        actionId: 'quarto_place_piece',
    },
    handle: async (payload, respond) => {
        const gameId = payload.actions[0].value;
        let state = await db.get(gameId);
        let { game } = state;

        state.game = Quarto.play(game, {
            player: Quarto.getActivePlayerName(game),
            type: 'PLACE',
            data: state.possiblePlacement
        });

        state = stateSwitchPlayers(state);

        await db.set(gameId, state);
        
        respond({
            text: 'Placed!'
        });

        getPieceOffer(gameId);
    }
}

const handleClaim = {
    match: {
        actionId: 'quarto_claim_victory'
    },
    handle: async (payload, respond) => {
        try {
            const gameId = payload.actions[0].value;
            let state = await db.get(gameId);
            state.triedForVictory = true;

            let { game } = state;
            state.game = Quarto.play(game, {
                player: Quarto.getActivePlayerName(game),
                type: 'CLAIM'
            });

            if(state.game.gameOver) {
                await postToChannel(state.channel, screens.gameEndScreen(state));
                respond({
                    text: 'Yay, you win!'
                });
            } else {
                await db.set(gameId, state);
                respond(screens.pieceSelection(gameId, state));
            }
        } catch (e) {
            console.log(e);
        }
    }
}

module.exports = {
    handleChallengeBasic,
    handleChallengeAdvanced,
    handleAcceptChallenge,
    handleDeclineChallenge,
    handleSelectPiece,
    handleOfferPiece,
    handleSelectPlacement,
    handlePlacement,
    handleClaim
}