const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const { body, validationResult, check } = require('express-validator');
const path = require("path");
const app = express();
const { authSocket, socketServer } = require("./socketServer");
const posts = require("./routes/posts");
const users = require("./routes/users");
const comments = require("./routes/comments");
const messages = require("./routes/messages");
const twoFactor = require("./routes/twoFactor");
const PostLike = require("./models/PostLike");
const Post = require("./models/Post");
const { requestLogger, errorLogger } = require("./util/logger");

dotenv.config();

console.log("Starting server...");

const httpServer = require("http").createServer(app);
const io = require("socket.io")(httpServer, {
  cors: {
    origin: ["http://localhost:3000", "https://axon-app.herokuapp.com"],
  },
});

io.use(authSocket);
io.on("connection", (socket) => {
  console.log("Socket connection established");
  socketServer(socket);
});

console.log("Connecting to MongoDB...");
// Updated Mongoose connection without deprecated options
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
  })
  .catch(err => {
    console.error("MongoDB connection error:", err);
    process.exit(1); // Exit process with failure
  });

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later."
});

// Apply rate limiting to all requests
app.use(limiter);

const port = process.env.PORT || 4001;
console.log("Attempting to listen on port", port);
app.use(express.json());

// Add request logging middleware
app.use(requestLogger);

// Configure CORS with specific origins
const corsOptions = {
  origin: ["http://localhost:3000", "http://localhost:4001", "https://axon-app.herokuapp.com"],
  optionsSuccessStatus: 200,
  credentials: true // Allow credentials
};

app.use(cors(corsOptions));

httpServer.listen(port, () => {
  console.log("Server listening on port", port);
}).on('error', (err) => {
  console.error('Server error:', err);
});
app.use(helmet()); // Add security headers
app.use(compression()); // Add compression middleware

// Simple test route
app.get("/", (req, res) => {
  res.json({ message: "Server is running" });
});

app.get("/api/test", (req, res) => {
  res.json({ message: "API is working" });
});

app.use("/api/posts", posts);
app.use("/api/users", users);
app.use("/api/comments", comments);
app.use("/api/messages", messages);
app.use("/api/2fa", twoFactor); // Add 2FA routes

// Add error logging middleware
app.use(errorLogger);

// Error handling middleware
app.use((err, req, res, next) => {
  // Log the error
  console.error(err.stack);
  
  // Send error response
  res.status(500).json({
    error: "Something went wrong!",
    message: process.env.NODE_ENV === "development" ? err.message : "Internal server error"
  });
});

if (process.env.NODE_ENV == "production") {
  app.use(express.static(path.join(__dirname, "/client/build")));

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "client/build", "index.html"));
  });
}