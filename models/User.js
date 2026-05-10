const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },

    ratings: {
      rapid: { type: Number, default: 1200 },
      blitz: { type: Number, default: 1200 },
      bullet: { type: Number, default: 1200 }
    },

    bestRating: {
      rapid: { type: Number, default: 1200 },
      blitz: { type: Number, default: 1200 },
      bullet: { type: Number, default: 1200 }
    },

    gamesPlayed: {
      rapid: { type: Number, default: 0 },
      blitz: { type: Number, default: 0 },
      bullet: { type: Number, default: 0 }
    },
    
    winStreak: {
      rapid: { type: Number, default: 0 },
      blitz: { type: Number, default: 0 },
      bullet: { type: Number, default: 0 }
    },

    stats: {
  rapid: {
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    draws: { type: Number, default: 0 }
  },
  blitz: {
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    draws: { type: Number, default: 0 }
  },
  bullet: {
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    draws: { type: Number, default: 0 }
  }
},

achievements: {
  type: [String],
  default: []
},

ratingHistory: {
  rapid: [
    {
      rating: Number,
      date: { type: Date, default: Date.now }
    }
  ],
  blitz: [
    {
      rating: Number,
      date: { type: Date, default: Date.now }
    }
  ],
  bullet: [
    {
      rating: Number,
      date: { type: Date, default: Date.now }
    }
  ]
}
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);