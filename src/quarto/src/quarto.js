const Jimp = require('jimp');

/**
 * Create a fresh game of Quarto
 * 
 * @param {string} player1 
 * @param {string} player2 
 */
const newGame = (player1, player2, advancedRules) => {
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
        advancedRules,
        players: [player1, player2],
        lastPlacements: [null],
        winType: null,
        winIndex: null,
        winningFields: null
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
 * @param {integer} lastPlacement
 */
const hasWinningRow = (board, lastPlacement) => {

    if(lastPlacement === null) {
        return { isAWin: false };
    }

    const { row, column } = parseIndex(lastPlacement);

    const boardRow = [board[4*row], board[4*row+1], board[4*row+2], board[4*row+3]];

    if(isWinningSet(boardRow)) {
        return {
            isAWin: true,
            winType: 'row',
            winIndex: row,
            winningFields: [4*row, 4*row+1, 4*row+2, 4*row+3]
        }
    }

    return { isAWin: false };
}

/**
 * Checks whether there is a win by column on the board
 * @param {Piece[]} board 
 * @param {integer} lastPlacement
 */
const hasWinningColumn = (board, lastPlacement) => {
    if(lastPlacement === null) {
        return { isAWin: false };
    }

    const { row, column } = parseIndex(lastPlacement);

    const boardColumn = [board[column], board[column+4], board[column+8], board[column+12]];

    if(isWinningSet(boardColumn)) {
        return {
            isAWin: true,
            winType: 'row',
            winIndex: row,
            winningFields: [column, column+4, column+8, column+12]
        }
    }

    return { isAWin: false };
}

/**
 * Checks whether there is a win by diagonal on the board
 * @param {Piece[]} board
 * @param {integer} lastPlacement
 */
const hasWinningDiagonal = (board, lastPlacement) => {

    if(lastPlacement === null) {
        return { isAWin: false };
    }

    const { row, column } = parseIndex(lastPlacement);

    if(!(row === column || row + column === 5)) {
        return { isAWin: false };
    }

    if(isWinningSet([board[0], board[5], board[10], board[15]])) {
        return {
            isAWin: true,
            winType: 'diagonal',
            winIndex: 0,
            finningFields: [0, 5, 10, 15] 
        };
    } else if(isWinningSet([board[3], board[6], board[9], board[12]])) {
        return {
            isAWin: true, 
            winType: 'diagonal',
            winIndex: 1,
            winningFields: [3, 6, 9, 12]
        };
    }

    return { isAWin: false };
}

/**
 * Checks whether any of the 9 squares on the board wins
 * @param {Piece[]} board 
 * @param {integer} lastPlacement
 */
const hasWinningSquare = (board, lastPlacement) => {
    if(lastPlacement === null) {
        return { isAWin: false };
    }

    for(let r = 0; r < 3; r++) {
        for(let c = 0; c < 3; c++) {
            const index = 4*r+c;
            const indices = [index, index+1, index+4, index+5];
            if(indices.indexOf(lastPlacement) >= 0) {
                const square = indices.map((e) => board[e]);
                if(isWinningSet(square)) {
                    return {
                        isAWin: true,
                        winType: 'square',
                        winIndex: index,
                        winningFields: indices
                    };
                }
            }
        }
    }
    return { isAWin: false };
}

/**
 * Checks whether there is a win on the board
 * @param {Quarto} game 
 */
const hasWinningPosition = ({ board, advancedRules, lastPlacements }) => {

    for(let lp of lastPlacements) {
        if(lp !== null) {
            const byRow = hasWinningRow(board, lp);
            if(byRow.isAWin) {
                return byRow;
            }
            
            const byCol = hasWinningColumn(board, lp);
            if(byCol.isAWin) {
                return byCol;
            }
        
            const byDiag = hasWinningDiagonal(board, lp);
            if(byDiag.isAWin) {
                return byDiag;
            }
        
            if(advancedRules) {
                const bySquare = hasWinningSquare(board, lp);
                if(bySquare.isAWin) {
                    return bySquare;
                }
            }
        }
    }

    return { isAWin: false };
}

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
        return setGameState(game);
    }

    // Redux says Hi but couldn't come due to overkill
    switch(move.type) {
        case 'PLACE':
            let nextBoard = [...game.board];
            let lastPlacements = game.lastPlacements;

            const { index } = parsePosition(move.data);
            nextBoard[index] = game.pieceOnOffer;

            return setGameState(game, { board: nextBoard, pieceOnOffer: null, lastPlacements: [...lastPlacements, index] });
        case 'OFFER_PIECE':
            if(game.pieceOnOffer !== null) {
                return setGameState(game);
            }

            return setGameState(game, {
                pieceOnOffer: move.data,
                activePlayer: 1 - game.activePlayer,
                lastPlacements: [game.lastPlacements[1]]
            });
        case 'CLAIM':
            const { isAWin, winType, winIndex, winningFields } = hasWinningPosition(game);
            if(isAWin) {
                return setGameState(game, {
                    winningPlayer: game.activePlayer,
                    gameOver: true,
                    winType,
                    winIndex,
                    winningFields
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

const quarToPng = async (game, highlights = true) => {
    const offeredPieceOffset = {
        x: 256-64,
        y: 0
    };

    const boardStart = 128;

    const tileSize = 128;

    const leftOffset = 18;

    try {
        let boardImg = await Jimp.read(__dirname + '/../img/board.png');
        let piecesImg = await Jimp.read(__dirname + '/../img/pieces.png');

        const { pieceOnOffer, board, lastPlacements, winningFields } = game;
        lastPlacement = lastPlacements[lastPlacements.length - 1];

        if(pieceOnOffer !== null) {
            const { row: pooRow, column: pooColumn } = parseIndex(pieceOnOffer);
            boardImg.blit(
                piecesImg,
                leftOffset + offeredPieceOffset.x,
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
                    leftOffset + tileSize*column,
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
                    leftOffset + tileSize*column,
                    tileSize*row + boardStart + 512,
                    tileSize*column,
                    tileSize*row,
                    tileSize,
                    tileSize);
            }
        });

        if(highlights) {

            let highlightImg = await Jimp.read(__dirname + '/../img/glow.png');

            if(winningFields !== null) {
                winningFields.forEach((e) => {
                    const { row, column } = parseIndex(e);
                    boardImg.blit(
                        highlightImg,
                        leftOffset + tileSize*column,
                        tileSize*row + boardStart
                    );
                });
            } else if(lastPlacement !== null) {
                const { row, column } = parseIndex(lastPlacement);
                boardImg.blit(
                    highlightImg,
                    leftOffset + tileSize*column,
                    tileSize*row + boardStart
                );
            }
        }

        return boardImg.getBufferAsync(Jimp.MIME_PNG);
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