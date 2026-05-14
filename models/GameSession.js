// models/GameSession.js
// Records a single completed game run for a player.
// Kept intentionally simple — no per-click telemetry.

const mongoose = require("mongoose");

const gameSessionSchema = new mongoose.Schema(
  {
    // Which player does this session belong to?
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true, // Index for fast "sessions by user" queries
    },

    score:               { type: Number, required: true, default: 0 },
    levelReached:        { type: Number, required: true, default: 1 },
    averageReactionTime: { type: Number, default: 0 },   // ms
    accuracy:            { type: Number, default: 0 },   // 0-100 %
    sessionDuration:     { type: Number, default: 0 },   // seconds
    mode:                { type: String, default: "classic" },
    playedAt:            { type: Date, default: Date.now },
  },
  {
    // No timestamps needed — playedAt already captures when the game happened
    timestamps: false,
  }
);

module.exports = mongoose.model("GameSession", gameSessionSchema);
