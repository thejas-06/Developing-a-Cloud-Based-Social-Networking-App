const jwt = require("jsonwebtoken");
const { error } = require("./util/logger");
let users = [];

const authSocket = (socket, next) => {
  let token = socket.handshake.auth.token;

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.TOKEN_KEY);
      socket.decoded = decoded;
      next();
    } catch (err) {
      error("Socket authentication error:", { error: err.message, token: token });
      next(new Error("Authentication error"));
    }
  } else {
    error("Socket authentication error: No token provided");
    next(new Error("Authentication error"));
  }
};

const socketServer = (socket) => {
  const userId = socket.decoded.userId;
  users.push({ userId, socketId: socket.id });
  
  // Log connection
  console.log(`User ${userId} connected with socket ${socket.id}`);

  socket.on("send-message", (recipientUserId, username, content) => {
    try {
      // Validate inputs
      if (!recipientUserId || !username || !content) {
        console.error("Invalid message data");
        return;
      }
      
      const recipient = users.find((user) => user.userId == recipientUserId);
      if (recipient) {
        socket
          .to(recipient.socketId)
          .emit("receive-message", userId, username, content);
      }
    } catch (err) {
      error("Error sending message:", { error: err.message, userId, recipientUserId });
    }
  });

  socket.on("disconnect", () => {
    try {
      users = users.filter((user) => user.userId != userId);
      console.log(`User ${userId} disconnected`);
    } catch (err) {
      error("Error during socket disconnect:", { error: err.message, userId });
    }
  });
  
  // Handle socket errors
  socket.on("error", (err) => {
    error("Socket error:", { error: err.message, userId });
  });
};

module.exports = { socketServer, authSocket };
