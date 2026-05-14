// routes/sessionRoutes.js

const express = require("express");
const router = express.Router();

const { saveSession, getHistory } = require("../controllers/sessionController");
const { protect } = require("../middleware/authMiddleware");

router.post("/save",    protect, saveSession); // Save a completed game
router.get("/history",  protect, getHistory);  // Fetch last 10 sessions

module.exports = router;
