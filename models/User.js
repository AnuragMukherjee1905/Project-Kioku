// models/User.js
// Defines what a NeuroFlash player looks like in the database.

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      minlength: [3, "Username must be at least 3 characters"],
      maxlength: [20, "Username can be at most 20 characters"],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/\S+@\S+\.\S+/, "Please provide a valid email"],
    },

    // Stored as a bcrypt hash — never the raw password
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false, // Never returned in queries unless explicitly requested
    },

    // ----- Game stats (updated after every session) -----
    bestScore:       { type: Number, default: 0 },
    highestLevel:    { type: Number, default: 0 },
    gamesPlayed:     { type: Number, default: 0 },
    avgReactionTime: { type: Number, default: 0 }, // milliseconds
    accuracy:        { type: Number, default: 0 }, // percentage 0-100
  },
  {
    timestamps: true, // Adds createdAt + updatedAt automatically
  }
);

// ---- Pre-save hook: hash the password before storing ----
// This runs automatically whenever a User document is saved.
userSchema.pre("save", async function (next) {
  // Only re-hash if the password field was actually changed
  if (!this.isModified("password")) return next();

  const salt = await bcrypt.genSalt(12); // 12 rounds = good balance of security vs speed
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ---- Instance method: compare a plain password to the stored hash ----
userSchema.methods.comparePassword = async function (plainPassword) {
  return bcrypt.compare(plainPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
