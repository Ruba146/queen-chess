const express = require("express");
const cors = require("cors");
const path = require("path");

const authRoutes = require("./routes/auth");
const gameRoutes = require("./routes/game");
const analysisRoutes = require("./routes/analysis");
const aiLearningRoutes = require("./routes/aiLearning");
const quizRoutes = require("./routes/quiz");
const chatRoutes = require("./routes/chat");
const aiMemoryRoutes = require("./routes/aiMemory");
const dashboardRoutes = require("./routes/dashboard");
const dailyMissionRoutes = require("./routes/dailyMission");
const aiCoachRoutes = require("./routes/aiCoach");
const gameAnalysisRoutes = require("./routes/gameAnalysis");
const errorHandler = require("./middleware/errorMiddleware");

const app = express();

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, "..", "frontend")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "frontend", "login.html"));
});

app.use("/api/auth", authRoutes);
app.use("/api/game", gameRoutes);
app.use("/api/analysis", analysisRoutes);
app.use("/api/ai", aiLearningRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/ai-memory", aiMemoryRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/daily-mission", dailyMissionRoutes);
app.use("/api/ai", aiCoachRoutes);
app.use("/api/ai", gameAnalysisRoutes);

app.use(errorHandler);

module.exports = app;