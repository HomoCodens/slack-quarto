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
            assert(piecesHavePropertyInCommon(1, 3, 0));
        });

        it('returns false on pieces not sharing a property', () => {
            assert(!piecesHavePropertyInCommon(2, 4, 1));
        });
    });

    describe('isWinningSet', () => {
        const quarto = rewire('./quarto');
        const fakePiecesHavePropertyInCommon = sinon.stub();
        quarto.__set__('piecesHavePropertyInCommon', fakePiecesHavePropertyInCommon);

        beforeEach(() => fakePiecesHavePropertyInCommon.reset());

        it('returns true on winning', () => {
            fakePiecesHavePropertyInCommon.returns(true);
            assert(quarto.isWinningSet([0, 1, 2, 3]));
            assert(fakePiecesHavePropertyInCommon.calledThrice);
        });

        it('returns false on not winning', () => {
            fakePiecesHavePropertyInCommon.returns(false);
            assert(!quarto.isWinningSet([0, 1, 2, 3]));
            assert.equal(fakePiecesHavePropertyInCommon.callCount, 4);
        });

        it('properly uses piecesHavePropertyInCommon', () => {
            fakePiecesHavePropertyInCommon.onCall(2).returns(false);
            fakePiecesHavePropertyInCommon.returns(true);
            quarto.isWinningSet([0, 1, 2, 3]);
            assert.deepStrictEqual(fakePiecesHavePropertyInCommon.args, [
                [0, 1, 0],
                [0, 2, 0],
                [0, 3, 0],
                [0, 1, 1],
                [0, 2, 1],
                [0, 3, 1]
            ]);
        });

        it('breaks in the middle', () => {
            fakePiecesHavePropertyInCommon.onCall(1).returns(false);
            fakePiecesHavePropertyInCommon.onCall(4).returns(false);
            fakePiecesHavePropertyInCommon.onCall(6).returns(false);
            fakePiecesHavePropertyInCommon.onCall(9).returns(false);
            fakePiecesHavePropertyInCommon.returns(true);
            assert(!quarto.isWinningSet([0, 1, 2, 3]));
            assert.equal(fakePiecesHavePropertyInCommon.callCount, 10);
        });

        it('cancels early if pieces are negative', () => {            
            assert(!quarto.isWinningSet([0, 4, 16, -1]));
            assert(!fakePiecesHavePropertyInCommon.called);
        });
    });

    describe('hasWinningRow', () => {
        const quarto = rewire('./quarto');
        const fakeIsWinningSet = sinon.stub();
        quarto.__set__('isWinningSet', fakeIsWinningSet);

        const board = [
            0, 1, 2, 3,
            4, 5, 6, 7,
            8, 9, 10, 11,
            12, 13, 14, 15
        ];

        beforeEach(() => fakeIsWinningSet.reset());

        it('calls isWinningSet with all rows', () => {
            fakeIsWinningSet.returns(false);
            quarto.hasWinningRow(board);
            assert.deepStrictEqual(fakeIsWinningSet.args, [
                [[0, 1, 2, 3]],
                [[4, 5, 6, 7]],
                [[8, 9, 10, 11]],
                [[12, 13, 14, 15]]
            ]);
        });

        it('returns true on win', () => {
            fakeIsWinningSet.returns(true);
            assert(quarto.hasWinningRow(board));
        });

        it('returns true if the third row wins', () => {
            fakeIsWinningSet.returns(false);
            fakeIsWinningSet.onThirdCall().returns(true);
            assert(quarto.hasWinningRow(board));
            assert(fakeIsWinningSet.calledThrice);
        });

        it('returns false when not won', () => {
            fakeIsWinningSet.returns(false);
            assert(!quarto.hasWinningRow(board));
        });
    });

    describe('hasWinningColumn', () => {
        const quarto = rewire('./quarto');
        const fakeIsWinningSet = sinon.stub();
        quarto.__set__('isWinningSet', fakeIsWinningSet);

        const board = [
            0, 1, 2, 3,
            4, 5, 6, 7,
            8, 9, 10, 11,
            12, 13, 14, 15
        ];

        beforeEach(() => fakeIsWinningSet.reset());

        it('calls isWinningSet with all columns', () => {
            fakeIsWinningSet.returns(false);
            quarto.hasWinningColumn(board);
            assert.deepStrictEqual(fakeIsWinningSet.args, [
                [[0, 4, 8, 12]],
                [[1, 5, 9, 13]],
                [[2, 6, 10, 14]],
                [[3, 7, 11, 15]]
            ]);
        });

        it('returns true on win', () => {
            fakeIsWinningSet.returns(true);
            assert(quarto.hasWinningColumn(board));
        });

        it('returns true if the third col wins', () => {
            fakeIsWinningSet.returns(false);
            fakeIsWinningSet.onThirdCall().returns(true);
            assert(quarto.hasWinningColumn(board));
            assert(fakeIsWinningSet.calledThrice);
        });

        it('returns false when not won', () => {
            fakeIsWinningSet.returns(false);
            assert(!quarto.hasWinningColumn(board));
        });
    });

    describe('hasWinningDiagonal', () => {
        const quarto = rewire('./quarto');
        const fakeIsWinningSet = sinon.stub();
        quarto.__set__('isWinningSet', fakeIsWinningSet);

        const board = [
            0, 1, 2, 3,
            4, 5, 6, 7,
            8, 9, 10, 11,
            12, 13, 14, 15
        ];

        beforeEach(() => fakeIsWinningSet.reset());

        it('calls isWinningSet with both diagonals', () => {
            fakeIsWinningSet.returns(false);
            quarto.hasWinningDiagonal(board);
            assert.deepStrictEqual(fakeIsWinningSet.args, [
                [[0, 5, 10, 15]],
                [[3, 6, 9, 12]]
            ]);
        });

        it('returns true on win', () => {
            fakeIsWinningSet.returns(true);
            assert(quarto.hasWinningDiagonal(board));
        });

        it('returns true if the second diagonal wins', () => {
            fakeIsWinningSet.returns(false);
            fakeIsWinningSet.onSecondCall().returns(true);
            assert(quarto.hasWinningDiagonal(board));
            assert(fakeIsWinningSet.calledTwice);
        });

        it('returns false when not won', () => {
            fakeIsWinningSet.returns(false);
            assert(!quarto.hasWinningDiagonal(board));
        });
    });

    describe('hasWinningSquare', () => {
        const quarto = rewire('./quarto');
        const fakeIsWinningSet = sinon.stub();
        quarto.__set__('isWinningSet', fakeIsWinningSet);

        const board = [
            0, 1, 2, 3,
            4, 5, 6, 7,
            8, 9, 10, 11,
            12, 13, 14, 15
        ];

        beforeEach(() => fakeIsWinningSet.reset());

        it('calls isWinningSet with both diagonals', () => {
            fakeIsWinningSet.returns(false);
            quarto.hasWinningSquare(board);
            assert.deepStrictEqual(fakeIsWinningSet.args, [
                [[0, 1, 4, 5]],
                [[1, 2, 5, 6]],
                [[2, 3, 6, 7]],
                [[4, 5, 8, 9]],
                [[5, 6, 9, 10]],
                [[6, 7, 10, 11]],
                [[8, 9, 12, 13]],
                [[9, 10, 13, 14]],
                [[10, 11, 14, 15]]
            ]);
        });

        it('returns true on win', () => {
            fakeIsWinningSet.returns(true);
            assert(quarto.hasWinningSquare(board));
        });

        it('returns true if the 5th square wins', () => {
            fakeIsWinningSet.returns(false);
            fakeIsWinningSet.onCall(4).returns(true);
            assert(quarto.hasWinningSquare(board));
            assert.equal(fakeIsWinningSet.callCount, 5);
        });

        it('returns false when not won', () => {
            fakeIsWinningSet.returns(false);
            assert(!quarto.hasWinningSquare(board));
        });
    });
});