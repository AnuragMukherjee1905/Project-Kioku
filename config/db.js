// config/db.js
// Connects to MongoDB using Mongoose.
// Call connectDB() once in server.js — all models share this connection.

const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅  MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error("❌  MongoDB connection failed:", err.message);
    process.exit(1); // Exit immediately — nothing works without a DB
  }
};

module.exports = connectDB;
