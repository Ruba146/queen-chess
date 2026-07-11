const mongoose = require("mongoose");

const gameSchema = new mongoose.Schema(
{

  // player who played game
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

  // opening
  opening: {
    type: String,
    default: "Unknown Opening"
  },

  // accuracy
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
  },

  // AI Analysis fields
  ratingAfterGame: {
    type: Number,
    default: 1200
  },

  rankAfterGame: {
    type: String,
    default: "Beginner"
  },

  playerLevelAfterGame: {
    type: String,
    default: "Beginner"
  },

  ratingChange: {
    type: Number,
    default: 0
  },

  // Performance analysis
  strengths: [{
    type: String
  }],

  weaknesses: [{
    type: String
  }],

  // Phase scores
  openingScore: {
    type: Number,
    default: 0
  },

  middleGameScore: {
    type: Number,
    default: 0
  },

  endgameScore: {
    type: Number,
    default: 0
  },

  // Coach recommendations
  coachRecommendations: [{
    type: String
  }],

  // Performance score (0-100)
  performanceScore: {
    type: Number,
    default: 0
  },

  // Detailed move analysis
  moveAnalysis: [{
    moveNumber: Number,
    move: String,
    classification: String,
    loss: Number,
    evalBefore: Number,
    evalAfter: Number,
    phase: String // opening, middlegame, endgame
  }],

  // Evaluation data for graphs
  evaluationData: [{
    moveNumber: Number,
    playerEval: Number,
    bestEval: Number,
    diff: Number
  }],

  // Statistics
  bestMoves: { type: Number, default: 0 },
  excellentMoves: { type: Number, default: 0 },
  goodMoves: { type: Number, default: 0 },
  inaccuracies: { type: Number, default: 0 },
  mistakes: { type: Number, default: 0 },
  blunders: { type: Number, default: 0 },
  brilliantMoves: { type: Number, default: 0 },
  missedWins: { type: Number, default: 0 },

  // Material balance
  materialBalance: { type: Number, default: 0 },

  // Piece activity score
  pieceActivityScore: { type: Number, default: 0 },

  // King safety score
  kingSafetyScore: { type: Number, default: 0 },

  // Endgame quality score
  endgameQualityScore: { type: Number, default: 0 },

  // Tactical ability score
  tacticalAbilityScore: { type: Number, default: 0 },

  // Positional play score
  positionalPlayScore: { type: Number, default: 0 },

  // Decision making score
  decisionMakingScore: { type: Number, default: 0 },

  // Consistency score
  consistencyScore: { type: Number, default: 0 },

  // Playing style
  playingStyle: {
    type: String,
    default: "Balanced"
  },

  // Average centipawn loss
  averageCentipawnLoss: {
    type: Number,
    default: 0
  },

  // Duration in seconds
  duration: {
    type: Number,
    default: 0
  },

  // Difficulty played against
  difficulty: {
    type: String,
    default: "intermediate"
  }
},

{ timestamps: true }
);

module.exports = mongoose.model("Game", gameSchema);