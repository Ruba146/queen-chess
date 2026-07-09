const mongoose = require("mongoose");

const gameSchema = new mongoose.Schema(
{

  //  player who played  game
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  // type of game
  mode: {
    type: String,
    default: "rapid"
  },

  // result
  result: {
    type: String,
    default: "unknown"
  },

  // oppening
  opening: {
    type: String,
    default: "Unknown Opening"
  },

  //  accuracy
  accuracy: {
    type: Number,
    default: 0
  },

  // moves
  moves: [
    {
      type: String
    }
  ],

  // PGN
  pgn: {
    type: String
  },

  // players
  players: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  ],

  // winner
  winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },

  // elo after and before
  ratingsBefore: {
    player1: Number,
    player2: Number
  },

  ratingsAfter: {
    player1: Number,
    player2: Number
  },

  playerColor:{
    type:String,
    default:"white"
}


},

{ timestamps: true }
);

module.exports = mongoose.model("Game", gameSchema);