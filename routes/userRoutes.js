// routes/userRoutes.js

const express = require("express");
const router = express.Router();

const { getProfile, getLeaderboard } = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");

router.get("/profile",     protect, getProfile);   // Must be logged in
router.get("/leaderboard", getLeaderboard);         // Public — anyone can view

module.exports = router;
