const jwt = require("jsonwebtoken");
const User = require("../models/User");

const verifyToken = (req, res, next) => {
  try {
    const token = req.headers["x-access-token"];

    if (!token) {
      throw new Error("No token provided");
    }

    const { userId, isAdmin } = jwt.verify(token, process.env.TOKEN_KEY);

    req.body = {
      ...req.body,
      userId,
      isAdmin,
    };

    return next();
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

const optionallyVerifyToken = (req, res, next) => {
  try {
    const token = req.headers["x-access-token"];

    if (!token) return next();

    const decoded = jwt.verify(token, process.env.TOKEN_KEY);
    req.body.userId = decoded.userId;

    next();
  } catch (err) {
    return next();
  }
};

// New middleware for refresh token verification
const verifyRefreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new Error("No refresh token provided");
    }

    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_KEY || process.env.TOKEN_KEY);
    
    // Check if user exists
    const user = await User.findById(decoded.userId);
    if (!user) {
      throw new Error("Invalid refresh token");
    }

    req.userId = decoded.userId;
    next();
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

module.exports = { verifyToken, optionallyVerifyToken, verifyRefreshToken };