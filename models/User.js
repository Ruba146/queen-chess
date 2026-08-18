const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    displayName: { type: String, default: "" },

    profilePicture: {
      type: String,
      default: ""
    },

    preferredSide: {
      type: String,
      enum: ["white", "black", "random"],
      default: "random"
    },

    mostPlayedDifficulty: {
      type: String,
      default: "intermediate"
    },

    favoriteOpening: {
      type: String,
      default: "Unknown"
    },

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
    },

    // Player level system
    playerLevel: {
      type: String,
      default: "Beginner"
    },

    // Total accuracy sum for average accuracy calculation
    totalAccuracySum: {
      type: Number,
      default: 0
    },

    totalAccuracyGames: {
      type: Number,
      default: 0
    },

    // Consistency tracking
    consistencyScore: {
      type: Number,
      default: 0
    },

    // Total centipawn loss sum
    totalCentipawnLoss: {
      type: Number,
      default: 0
    },

    totalCentipawnGames: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);