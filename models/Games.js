const mongoose = require("mongoose");

const gameSchema = new mongoose.Schema(
{

  // 👤 صاحب المباراة
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  // ♟️ نوع المباراة
  mode: {
    type: String,
    default: "rapid"
  },

  // 🏆 النتيجة
  result: {
    type: String,
    default: "unknown"
  },

  // 📖 الافتتاحية
  opening: {
    type: String,
    default: "Unknown Opening"
  },

  // 🎯 الدقة
  accuracy: {
    type: Number,
    default: 0
  },

  // ♟️ النقلات
  moves: [
    {
      type: String
    }
  ],

  // 📄 PGN
  pgn: {
    type: String
  },

  // 👥 اللاعبين
  players: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  ],

  // 👑 الفائز
  winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },

  // 📈 الإيلو قبل وبعد
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