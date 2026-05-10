const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

dotenv.config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" }
});

app.use(cors());
app.use(express.json());

// 🔥 يخدم الفرونت
app.use(express.static(path.join(__dirname, "frontend")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "login.html"));
});

// ================= DB =================
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.log("❌ MongoDB ERROR:", err));

// ================= ROUTES =================
const authRoutes = require("./routes/auth");
const gameRoutes = require("./routes/game");
const analysisRoutes = require("./routes/analysis");

app.use("/api/auth", authRoutes);
app.use("/api/game", gameRoutes);
app.use("/api/analysis", analysisRoutes);

// ================= SOCKET =================
io.on("connection", (socket) => {
  console.log("User connected");

  socket.on("move", (move) => {
    socket.broadcast.emit("move", move);
  });
});

// ================= START =================
server.listen(process.env.PORT || 5000, () => {
  console.log("Server running 🔥");
});

