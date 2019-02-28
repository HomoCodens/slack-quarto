const assert = require('assert');
const rewire = require('rewire');
const sinon = require('sinon');

describe('Quarto', () => {
    const freshGame = {
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
        players: ['player1', 'player2']
    };

    describe('newGame', () => {
        const { newGame } = require('./quarto');

        it('generate a new game', () => {
            assert.deepStrictEqual(newGame('player1', 'player2'), freshGame);
        });
    });

    describe('getActivePlayerName', () => {
        const { getActivePlayerName } = require('./quarto');

         it('gets the correct player name', () => {
             assert.equal(getActivePlayerName(freshGame), 'player1');
         });
    });

    describe('parsePosition', () => {
        const { parsePosition } = require('./quarto');
        it('parses c2', () => {
            const expected = {
                row: 1,
                column: 2,
                index: 6
            };

            assert.deepStrictEqual(parsePosition('c2'), expected);
        });
    });

    describe('parseIndex', () => {
        const { parseIndex } = require('./quarto');

        it('parses 13', () => {
            const expected = {
                row: 3,
                column: 1,
                str: 'b4'
            };

            assert.deepStrictEqual(parseIndex(13), expected);
        });
    });

    describe('piecesHavePropertyInCommon', () => {
        const { piecesHavePropertyInCommon } = require('./quarto');

        it('returns true when pieces have something in common', () => {
            assert.equal(piecesHavePropertyInCommon(1, 3, 0), true);
        });

        it('returns false on pieces not sharing a property', () => {
            assert.equal(piecesHavePropertyInCommon(2, 4, 1), false);
        });
    });

    /*describe('isWinningSet', () => {
        it('recognizes a winning set', () => {
            assert.equal(quarto.isWinningSet([1, 3, 5, 7]), true);
        });

        it('recognizes [0 1 2 3] as winning', () => {
            assert.equal(quarto.isWinningSet([0, 1, 2, 3]), true);
        });

        it('recognizes a non winning set', () => {
            assert.equal(quarto.isWinningSet([1, 2, 4, 8]), false);
        });
    });

    describe('hasWinningRow', () => {
        it('wins if won', () => {
            assert.equal(
                quarto.hasWinningRow([
                    -1, 3, -1, -1,
                    1, 2, 4, 8,
                    5, 7, 11, 13,
                    -1, -1, -1, -1
                ]),
                true
            );
        });

        it('doesnt win if not', () => {
            assert.equal(
                quarto.hasWinningRow([
                    -1, -1, -1, -1,
                    1, 2, 4, 8,
                    10, 12, -1, 0,
                    -1, 7, -1, -1
                ]),
                false
            );
        });
    });

    describe('hasWinningColumn', () => {
        it('wins if won', () => {
            assert.equal(
                quarto.hasWinningColumn([
                    -1, 1, 5, -1,
                    3, 2, 7, -1,
                    -1, 4, 11, -1,
                    -1, 8, 13, -1
                ]),
                true
            );
        });

        it('doesnt win if not', () => {
            assert.equal(
                quarto.hasWinningColumn([
                    -1, 1, 10, -1,
                    -1, 2, 12, 7,
                    -1, 4, -1, -1,
                    -1, 8, 0, -1
                ]),
                false
            );
        });
    });

    describe('hasWinningDiagonal', () => {
        it('recognizes a / win', () => {
            assert.equal(
                quarto.hasWinningDiagonal([
                    -1, 3, -1, 13,
                    1, 2, 11, 8,
                    0, 7, 9, 14,
                    5, -1, -1, -1
                ]),
                true
            );
        });

        it('recognizes a \\ win', () => {
            assert.equal(
                quarto.hasWinningDiagonal([
                    13, -1, 3, -1,
                    8, 11, 2, 1,
                    14, 9, 7, 0,
                    -1, -1, -1, 5
                ]),
                true
            );
        });
    });*/
});