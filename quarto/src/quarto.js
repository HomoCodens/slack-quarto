const Jimp = require('jimp');

/**
 * Create a fresh game of Quarto
 * 
 * @param {string} player1 
 * @param {string} player2 
 */
const newGame = (player1, player2) => {
    return {
        board: [
            -1, -1, -1, -1,
            -1, -1, -1, -1,
            -1, -1, -1, -1,
            -1, -1, -1, -1
        ],
        activePlayer: 0,
        winningPlayer: null,
        pieceOnOffer: null,
        drawBeingOffered: false,
        gameOver: false,
        advancedRules: false,
        players: [player1, player2]
    };
}

/**
 * Get the currently active player
 * 
 * @param {Quarto} game 
 */
const getActivePlayerName = (game) => game.players[game.activePlayer];

/**
 * Parce a Cell into row and column
 * 
 * @param {Cell} cell 
 */
const parsePosition = (cell) => {
    const columns = 'abcd';
    const parts = cell.split('');
    const column = columns.indexOf(parts[0]);
    const row =  +parts[1] - 1;
    return {
        row,
        column,
        index: column + row*4
    };
}

const parseIndex = (i) => {
    const row = Math.floor(i/4);
    const column = i % 4;
    const chars = 'abcd';
    return {
        row,
        column,
        str: `${chars[column]}${row+1}`
    };
}

/**
 * Checks whether two pieces have any properties in common
 * @param {Piece} a 
 * @param {Piece} b 
 * @param {integer} p - Index of the property to compare (0 for rightmost etc.)
 */
const piecesHavePropertyInCommon = (a, b, p) => (~(a ^ b) & (1 << p)) > 0

/**
 * Checks if the array of 4 pieces is a winning combination
 * i.e. they have at least one property in common.
 * @param {Piece[]} pieces 
 */
const isWinningSet = (pieces) => {
    for(let i = 0; i < 4; i++) {
        if(pieces[i] < 0) {
            return false;
        }
    }

    let winning = true;
    for(let p = 0; p < 4; p++) {
        for(let i = 1; i < 4; i++) {
            if(!piecesHavePropertyInCommon(pieces[0], pieces[i], p)) {
                winning = false;
                break;
            }
        }
        if(winning) {
            return true;
        }
        winning = true;
    }
    return false;
}

/**
 * Checks whether there is a win by row on the board
 * @param {Piece[]} board 
 */
const hasWinningRow = (board) => {
    for(let r = 0; r < 4; r++) {
        const row = [board[4*r], board[4*r+1], board[4*r+2], board[4*r+3]];
        if(isWinningSet(row)) {
            return true;
        }
    }
    return false;
}

/**
 * Checks whether there is a win by column on the board
 * @param {Piece[]} board 
 */
const hasWinningColumn = (board) => {
    for(let c = 0; c < 4; c++) {
        let column = [board[c], board[c+4], board[c+8], board[c+12]];
        if(isWinningSet(column)) {
            return true;
        }
    }
    return false;
}

/**
 * Checks whether there is a win by diagonal on the board
 * @param {Piece[]} board 
 */
const hasWinningDiagonal = (board) => {
    return isWinningSet([board[0], board[5], board[10], board[15]]) ||
            isWinningSet([board[3], board[6], board[9], board[12]]);
}

/**
 * Checks whether any of the 9 squares on the board wins
 * @param {Piece[]} board 
 */
const hasWinningSquare = (board) => {
    for(let r = 0; r < 3; r++) {
        for(let c = 0; c < 3; c++) {
            let index = 4*r+c;
            let square = [board[index], board[index+1], board[index+4], board[index+5]];
            if(isWinningSet(square)) {
                return true;
            }
        }
    }
    return false;
}

/**
 * Checks whether there is a win on the board
 * @param {Quarto} game 
 */
const hasWinningPosition = ({ board, advancedRules }) => hasWinningRow(board) ||
                                                            hasWinningColumn(board) ||
                                                            hasWinningDiagonal(board) ||
                                                            (advancedRules && hasWinningSquare(board));

const seq = (n) => Array.from(new Array(n), (e, i) => i);

const getRemainingPieces = (game) => seq(16).filter((e) => game.board.indexOf(e) < 0);

const getOpenSpaces = (game) => seq(16).filter((e) => game.board[e] < 0);

const cloneGame = (game) => {
    return {
        ...game,
        board: [...game.board],
        players: [...game.players]
    };
}

const setGameState = (game, newState = {}) => {
    let next = {
        ...cloneGame(game),
        ...newState
    };

    if(newState.board) {
        next.board = [...newState.board]
    }

    if(newState.players) {
        next.players = [...newState.players]
    }

    return next;
}

/**
 * 
 * @param {Quarto} game 
 * @param {Move} move 
 */
const play = (game, move) => {
    if(getActivePlayerName(game) !== move.player) {
        return game;
    }

    // Redux says Hi but couldn't come due to overkill
    switch(move.type) {
        case 'PLACE':
            let nextBoard = [...game.board];

            const { index } = parsePosition(move.data);
            nextBoard[index] = game.pieceOnOffer;

            return setGameState(game, { board: nextBoard, pieceOnOffer: null });
        case 'OFFER_PIECE':
            if(game.pieceOnOffer !== null) {
                return setGameState(game);
            }

            return setGameState(game, {
                pieceOnOffer: move.data,
                activePlayer: 1 - game.activePlayer
            });
        case 'CLAIM':
            if(hasWinningPosition(game)) {
                return setGameState(game, {
                    winningPlayer: game.activePlayer,
                    gameOver: true
                });
            } else {
                return setGameState(game);
            }
        case 'RESIGN':
            return setGameState(game, {
                winningPlayer: 1 - game.activePlayer,
                gameOver: true
            });
        case 'OFFER_DRAW':
            return setGameState(game, {
                drawBeingOffered: true,
                activePlayer: 1 - game.activePlayer
            });
        case 'ACCEPT_DRAW':
            return setGameState(game, {
                gameOver: true
            });
    }
}

const quarToPng = async (game) => {
    const offeredPieceOffset = {
        x: 256-64,
        y: 0
    };

    const boardStart = 128;

    const tileSize = 128;

    try {
        let boardImg = await Jimp.read(__dirname + '/../img/board.png');
        let piecesImg = await Jimp.read(__dirname + '/../img/pieces.png');

        const { pieceOnOffer, board } = game;

        if(pieceOnOffer !== null) {
            const { row: pooRow, column: pooColumn } = parseIndex(pieceOnOffer);
            boardImg.blit(
                piecesImg,
                offeredPieceOffset.x,
                offeredPieceOffset.y,
                tileSize*pooColumn,
                tileSize*pooRow,
                tileSize,
                tileSize);
        }

        for(let i = 0; i < 16; i++) {
            const piece = board[i];
            if(piece >= 0) {    
                const { row: pRow, column: pColumn } = parseIndex(piece);
                const { row, column } = parseIndex(i);
                boardImg.blit(
                    piecesImg,
                    tileSize*column,
                    tileSize*row + boardStart,
                    tileSize*pColumn,
                    tileSize*pRow,
                    tileSize,
                    tileSize);
            }
        }

        getRemainingPieces(game).forEach((p) => {
            if(p !== pieceOnOffer) {
                const {row, column } = parseIndex(p);
                boardImg.blit(
                    piecesImg,
                    tileSize*column,
                    tileSize*row + boardStart + 512,
                    tileSize*column,
                    tileSize*row,
                    tileSize,
                    tileSize);
            }
        });

        boardImg.write('./out.png');
    } catch(e) {
        console.log(e);
    }
}

module.exports = {
    newGame,
    getActivePlayerName,
    parsePosition,
    parseIndex,
    piecesHavePropertyInCommon,
    isWinningSet,
    hasWinningRow,
    hasWinningColumn,
    hasWinningDiagonal,
    hasWinningSquare,
    hasWinningPosition,
    getRemainingPieces,
    getOpenSpaces,
    play,
    quarToPng
};