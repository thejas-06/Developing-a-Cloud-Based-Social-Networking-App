const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const speakeasy = require("speakeasy");

// In-memory store for refresh tokens (in production, use Redis or database)
const refreshTokens = {};

const buildToken = (user) => {
  return {
    userId: user._id,
    isAdmin: user.isAdmin,
  };
};

const getUserDict = (token, refreshToken, user) => {
  return {
    token,
    refreshToken,
    username: user.username,
    userId: user._id,
    isAdmin: user.isAdmin,
    twoFactorEnabled: user.twoFactorEnabled,
  };
};

// Complete login with 2FA validation
const loginWith2FA = async (req, res) => {
  try {
    const { userId, token } = req.body;

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    if (!user.twoFactorEnabled) {
      throw new Error("2FA not enabled for this user");
    }

    // Verify the 2FA token
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: "base32",
      token: token,
      window: 2, // Allow a small window for time differences
    });

    if (!verified) {
      throw new Error("Invalid 2FA token");
    }

    // Generate tokens
    const accessToken = jwt.sign(buildToken(user), process.env.TOKEN_KEY, { expiresIn: "1h" });
    const refreshToken = jwt.sign({ userId: user._id }, process.env.REFRESH_TOKEN_KEY || process.env.TOKEN_KEY, { expiresIn: "7d" });
    
    // Store refresh token
    refreshTokens[refreshToken] = user._id;

    return res.json(getUserDict(accessToken, refreshToken, user));
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

module.exports = {
  loginWith2FA,
};