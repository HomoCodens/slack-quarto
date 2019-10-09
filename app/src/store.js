const db = require('./db');
const Quarto = require('./quarto');

const getGameId = (...parts) => parts.sort().join('');

const setChallenge = async (players, channel) => {
    const id = getGameId(players);

    const game = await db.get(id);

    await db.set(id, {
        players,
        channel,
        accepted: false
    });

    return id;
}

const acceptChallenge = async (gameId) => {
    const state = await db.get(gameId);


    const { players } = state;
    const gamePlayers = Math.random() > 0.5 ? [...players] : [...players].reverse();

    return db.set(gameId, {
        ...state,
        accepted: true,
        game: Quarto.newGame(gamePlayers[0], gamePlayers[1])
    });
}

const declineChallenge = async (gameId) => db.del(gameId);

module.exports = {
    setChallenge,
    acceptChallenge,
    declineChallenge
}