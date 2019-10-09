/**
 * A quarto piece
 * 
 * A quarto piece is represented by a number.
 * More precisely, the 4 LSB of the number are used to encode
 * the properties of the piece in the order
 * <BlackOrWhite><ShortOrTall><WithoutOrWithHole><RoundOrSquare>
 * 
 * So 0 would represent the black, short, holeless round piece (bthR)
 * 5 the black, tall, holeless square one etc.
 * 
 * @typedef {number} Piece
 */

/**
 * A Quarto game
 * 
 * Pieces are represented as numbers. The 4 LSB 
 * 
 * @typedef {Object} Quarto
 * @property {Piece[]} board - A length 16 array of pieces representing the 4x4 board
 * @property {boolean} advancedRules - Are advanced rules (i.e. win with square) in use?
 * @property {number} activePlayer - An index (0 or 1) into the players array denoting the active player
 * @property {number} winningPlayer - See activePlayer, for the winner (if any)
 * @property {boolean} drawBeingOffered 
 * @property {boolean} gameOver
 * @property {string[]} players - Array if player identifiers
 * @property {Piece} pieceOnOffer
 */

/**
 * A string representation of a cell on the qarto board
 * 
 * Rows are numbered 1-4, columns a-d (similar to chess)
 * 
 * @typedef {string} Cell
 */

 /**
  * A move in a quarto game
  * 
  * @typedef {Object} Move
  * @property {string} type - One of PLACE, OFFER and CLAIM
  * @property {string} player - The player performing the move
  * @property {PlaceMove|Piece|null} data - Additional parameters
  */

  /**
   * A move to place a piece
   * 
   * @typedef {Object} PlaceMove
   * @property {Cell} cell
   * @property {Piece} piece
   */