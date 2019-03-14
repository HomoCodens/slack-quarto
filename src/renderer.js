const express = require('express');

const Quarto = require('./quarto');

const router = express.Router();

const renderQuarto = async (req, res, next) => {
    const { pieces } = req.params;
    const [pieces_csv, piece_on_offer_str, last_placement_str, winning_line_str] = pieces.split(';');

    const pieces_arr = pieces_csv.split(',').map((x) => {
        if(x.length) {
            return Number.parseInt(x);
        } else {
            return -1;
        }
    });

    const piece_on_offer = piece_on_offer_str !== '' ? Number.parseInt(piece_on_offer_str) : null;

    const last_placement = last_placement_str !== '' ? Number.parseInt(last_placement_str) : null;

    const winning_line_arr = winning_line_str !== '' ? winning_line_str.split(',').map((x) => {
        if(x.length) {
            return Number.parseInt(x);
        } else {
            return null;
        }
    }) : null;

    if(pieces_arr.length !== 16 || (piece_on_offer && Number.isNaN(piece_on_offer))) {
        res.status(400).send('Malformed file name!');
    } else {
        const imgStream = await Quarto.quarToPng({
            board: pieces_arr,
            pieceOnOffer: piece_on_offer,
            lastPlacement: last_placement,
            winningFields: winning_line_arr }
        );
        res.type('image/png').send(imgStream);
    }
}

router.get('/:pieces.:mime', renderQuarto);

module.exports = router;