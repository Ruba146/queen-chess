function setupGameSocket(io) {
  io.on("connection", (socket) => {
    console.log("User connected");

    socket.on("move", (move) => {
      socket.broadcast.emit("move", move);
    });
  });
}

module.exports = { setupGameSocket };