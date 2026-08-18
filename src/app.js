const express = require("express");
const cors = require("cors");
const path = require("path");

const authRoutes = require("./routes/auth");
const gameRoutes = require("./routes/game");
const analysisRoutes = require("./routes/analysis");
const aiLearningRoutes = require("./routes/aiLearning");
const chatRoutes = require("./routes/chat");
const aiMemoryRoutes = require("./routes/aiMemory");
const dashboardRoutes = require("./routes/dashboard");
const dailyMissionRoutes = require("./routes/dailyMission");
const aiCoachRoutes = require("./routes/aiCoach");
const gameAnalysisRoutes = require("./routes/gameAnalysis");
const puzzleRoutes = require("./routes/puzzle");
const errorHandler = require("./middleware/errorMiddleware");

const app = express();

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, "..", "client", "dist")));

app.use("/api/auth", authRoutes);
app.use("/api/game", gameRoutes);
app.use("/api/analysis", analysisRoutes);
app.use("/api/ai", aiLearningRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/ai-memory", aiMemoryRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/daily-mission", dailyMissionRoutes);
app.use("/api/ai-coach", aiCoachRoutes);
app.use("/api/ai/game-analysis", gameAnalysisRoutes);
app.use("/api/puzzle", puzzleRoutes);

app.get("/stockfish.js", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "frontend", "stockfish.js"));
});

app.get("/stockfish.wasm", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "frontend", "stockfish.wasm"));
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "client", "dist", "index.html"));
});

app.use((req, res) => {
  res.sendFile(path.join(__dirname, "..", "client", "dist", "index.html"));
});

app.use(errorHandler);

module.exports = app;