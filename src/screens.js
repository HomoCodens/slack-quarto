const Quarto = require('./quarto');

const ruleSelectionScreen = (gameId) => {
    return {
        blocks: [
            {
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: 'What rules do you want to play by?'
                }
            },
            {
                type: 'actions',
                elements: [
                    {
                        type: 'button',
                        text: {
                            type: 'plain_text',
                            text: 'Basic (lines)',
                            emoji: true
                        },
                        value: gameId,
                        action_id: 'quarto_challenge_basic'
                    },
                    {
                        type: 'button',
                        text: {
                            type: 'plain_text',
                            text: 'Advanced (lines & squares)',
                            emoji: true
                        },
                        value: gameId,
                        action_id: 'quarto_challenge_advanced'
                    }
                ]
            }
        ]
    }
}

const challengeScreen = (gameId, state) => {
    const { advancedRules, game } = state;
    const [challengerId] = state.players;
    return {
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
    }
}

// Todo: get this dynamically
const getGameImageURL = (game) => `https://bd5498c9.ngrok.io/slackuarto/render/${game.board.map((e) => e < 0 ? '' : `${e}`).join(',')};${game.pieceOnOffer ? game.pieceOnOffer : ''}.png`;

const pieceSelection = (gameId, state) => {
    const { game } = state;
    const pieceOffered = state.pieceOnOffer;

    let actionElements = [
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
    ];

    if(pieceOffered !== null) {
        actionElements[0].initial_option = {
            text: {
                type: 'plain_text',
                text: `${pieceOffered}`
            },
            value: `${pieceOffered}`
        };

        actionElements.push({
            type: 'button',
            text: {
                type: 'plain_text',
                text: 'Offer piece'
            },
            value: gameId,
            action_id: 'quarto_offer_piece'
        });

        // For rendering only
        game.pieceOnOffer = pieceOffered;
    }

    blocks = [
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
            elements: actionElements
        }
    ];

    if(!state.triedForVictory) {
        blocks.push(
            {
                type: 'actions',
                elements: [{
                    type: 'button',
                        text: {
                            type: 'plain_text',
                            text: 'Claim victory'
                        },
                        value: gameId,
                        action_id: 'quarto_claim_victory'
                }]
            }
        )
    } else {
        blocks.push(
            {
                type: 'section',
                text: {
                    type: 'plain_text',
                    text: 'Victory not possible at this time.'
                }
            }
        )
    }

    return {
        blocks
    }
}

const piecePlacement = (gameId, state) => {
    const { game, possiblePlacement } = state;
    
    const spaces = Quarto.getOpenSpaces(game).map((e) => Quarto.parseIndex(e).str).sort();

    let actionElements = [
        {
            type: 'static_select',
            action_id: 'quarto_select_placement',
            options: spaces.map((e) => {
                return {
                    text: {
                        type: 'plain_text',
                        text: e
                    },
                    value: e
                }
            })
        }
    ];

    if(possiblePlacement) {
        actionElements[0].initial_option = {
            text: {
                type: 'plain_text',
                text: possiblePlacement
            },
            value: possiblePlacement
        };

        actionElements.push({
            type: 'button',
            text: {
                type: 'plain_text',
                text: 'Place piece'
            },
            value: gameId,
            action_id: 'quarto_place_piece'
        });
    }

    return {
        blocks: [
            {
                type: 'image',
                alt_text: 'board',
                image_url: getGameImageURL(game)
            },
            {
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: `<@${game.players[1-game.activePlayer]}> is offering you a piece.`
                }
            },
            {
                type: 'section',
                text: {
                    type: 'plain_text',
                    text: 'Where do you want to place the piece?'
                }
            },
            {
                type: 'actions',
                block_id: gameId,
                elements: actionElements
            }
        ]
    }
}

const turnSummary = (state) => {
    return {
        blocks: [
            {
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: `Quarto game between <@${state.players[0]}> and <@${state.players[1]}>`
                }
            },
            {
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: `<@${Quarto.getActivePlayerName(state.game)}> to play.`
                }
            },
            {
                type: 'image',
                alt_text: 'board',
                image_url: getGameImageURL(state.game)
            }
        ]
    }
}

const gameEndScreen = (state) => {
    return {
        blocks: [
            {
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: `Quarto game between <@${state.players[0]}> and <@${state.players[1]}>`
                }
            },
            {
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: `<@${state.game.winningPlayer}> wins!`
                }
            },
            {
                type: 'image',
                alt_text: 'board',
                image_url: getGameImageURL(state.game)
            }
        ]
    }
}

module.exports = {
    challengeScreen,
    ruleSelectionScreen,
    pieceSelection,
    piecePlacement,
    turnSummary,
    gameEndScreen
}