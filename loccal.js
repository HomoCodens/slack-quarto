const readline = require('readline');
const fs = require('fs');
const Quarto = require('./quarto/src/quarto');

let game = Quarto.newGame('banana', 'mananman');
let state = 'awaiting_offer';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: '?>'
});

const handleLine = (line) => {
    if(line === 'exit') {
        console.log('mkay, bye');
        rl.close();
    } else {
        if(state == 'awaiting_offer') {
            if(line === 'claim') {
                if(Quarto.hasWinningPosition(game)) {
                    console.log('indeedy');
                    rl.close();
                } else {
                    console.log('sorry, no win. try again');
                }
            } else if(Number.isInteger(+line)) {
                game = Quarto.play(game, {
                    type: 'OFFER_PIECE',
                    data: +line,
                    player: Quarto.getActivePlayerName(game)
                });
                state = 'awaiting_placement';
                console.log(`${Quarto.getActivePlayerName(game)}, place the PIECE!`);
            } else {
                console.log('That not a number boi');
            }
        } else if(state === 'awaiting_placement') {
            if(line.match(/[abcd][1234]/)) {
                game = Quarto.play(game, {
                    type: 'PLACE',
                    player: Quarto.getActivePlayerName(game),
                    data: line
                });
                state = 'awaiting_offer';
                console.log(`${Quarto.getActivePlayerName(game)}, your turn to offer...`);
                console.log('or type \'claim\' to claim victory');
            } else {
                console.log('gotsa match [abcd][1234] tho');
            }
        }

        Quarto.quarToPng(game).then((buffer) => {
            fs.writeFileSync('./out.png', buffer);
        }).catch((e) => console.log(e));
        rl.prompt();
    }
}

rl.on('line', handleLine);
console.log(`Game started! ${Quarto.getActivePlayerName(game)}, make your offer...`);
Quarto.quarToPng(game);
rl.prompt();

/*

const game = {
    pieceOnOffer: 6,
    board: [
        1, -1, -1, 12,
        -1, 2, 11, -1,
        -1, 10, 3, -1,
        9, -1, -1, 4
    ]
};

Quarto.quarToPng(game);*/