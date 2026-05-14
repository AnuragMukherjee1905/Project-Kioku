// server.js
// Entry point for the Project Kioku backend.
// Loads env vars → connects DB → mounts routes → starts listening.

require("dotenv").config(); // Must be first — loads .env before anything else

const express = require("express");
const cors    = require("cors");

const connectDB       = require("./config/db");
const authRoutes      = require("./routes/authRoutes");
const userRoutes      = require("./routes/userRoutes");
const sessionRoutes   = require("./routes/sessionRoutes");
const { errorHandler } = require("./middleware/errorMiddleware");

// ---- Connect to MongoDB ----
connectDB();

const app = express();

// ---- CORS ----
// Allow requests only from your frontend origin (set in .env)
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ---- Body parser ----
app.use(express.json());

// ---- Health check ----
app.get("/", (req, res) => {
  res.json({ status: "Project Kioku API is running 🚀" });
});

// ---- API Routes ----
app.use("/api/auth",     authRoutes);
app.use("/api/users",    userRoutes);
app.use("/api/sessions", sessionRoutes);

// ---- 404 handler (must come after all routes) ----
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

// ---- Global error handler (must be last) ----
app.use(errorHandler);

// ---- Start server ----
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🎮  Project Kioku API running on http://localhost:${PORT}`);
});
