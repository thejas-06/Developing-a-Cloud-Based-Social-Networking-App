const User = require("../models/User");
const Post = require("../models/Post");
const PostLike = require("../models/PostLike");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Follow = require("../models/Follow");
const { default: mongoose } = require("mongoose");

// In-memory store for refresh tokens (in production, use Redis or database)
const refreshTokens = {};

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

const buildToken = (user) => {
  return {
    userId: user._id,
    isAdmin: user.isAdmin,
  };
};

const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!(username && email && password)) {
      return res.status(400).json({ error: "Username, email, and password are required" });
    }

    const normalizedEmail = email.toLowerCase();

    const hashedPassword = await bcrypt.hash(password, 10);

    const existingUser = await User.findOne({
      $or: [{ email: normalizedEmail }, { username }],
    });

    if (existingUser) {
      return res.status(409).json({ error: "Email or username already exists" });
    }

    const user = await User.create({
      username,
      email: normalizedEmail,
      password: hashedPassword,
    });

    const token = jwt.sign(buildToken(user), process.env.TOKEN_KEY, { expiresIn: "1h" });
    const refreshToken = jwt.sign({ userId: user._id }, process.env.REFRESH_TOKEN_KEY || process.env.TOKEN_KEY, { expiresIn: "7d" });
    
    // Store refresh token
    refreshTokens[refreshToken] = user._id;

    return res.status(201).json(getUserDict(token, refreshToken, user));
  } catch (err) {
    console.error("Registration error:", err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: "Invalid user data provided" });
    }
    return res.status(500).json({ error: "An error occurred during registration" });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!(email && password)) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const normalizedEmail = email.toLowerCase();

    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Check if 2FA is enabled
    if (user.twoFactorEnabled) {
      // For 2FA enabled accounts, we return a partial login response
      // The client will then prompt for the 2FA token
      return res.json({
        requires2FA: true,
        userId: user._id,
        message: "2FA required"
      });
    }

    const token = jwt.sign(buildToken(user), process.env.TOKEN_KEY, { expiresIn: "1h" });
    const refreshToken = jwt.sign({ userId: user._id }, process.env.REFRESH_TOKEN_KEY || process.env.TOKEN_KEY, { expiresIn: "7d" });
    
    // Store refresh token
    refreshTokens[refreshToken] = user._id;

    return res.json(getUserDict(token, refreshToken, user));
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "An error occurred during login" });
  }
};

// New controller for refreshing access tokens
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: "Refresh token is required" });
    }

    // Check if refresh token exists
    if (!refreshTokens[refreshToken]) {
      return res.status(401).json({ error: "Invalid refresh token" });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_KEY || process.env.TOKEN_KEY);
    
    // Check if user exists
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: "Invalid refresh token" });
    }

    // Generate new access token
    const newToken = jwt.sign(buildToken(user), process.env.TOKEN_KEY, { expiresIn: "1h" });

    return res.json({ token: newToken });
  } catch (err) {
    console.error("Refresh token error:", err);
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: "Invalid or expired refresh token" });
    }
    return res.status(500).json({ error: "An error occurred while refreshing token" });
  }
};

// New controller for logging out (revoking refresh token)
const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      // Remove refresh token from store
      delete refreshTokens[refreshToken];
    }

    return res.json({ success: true });
  } catch (err) {
    console.error("Logout error:", err);
    return res.status(500).json({ error: "An error occurred during logout" });
  }
};

const follow = async (req, res) => {
  try {
    const { userId } = req.body;
    const followingId = req.params.id;

    const existingFollow = await Follow.find({ userId, followingId });

    if (existingFollow) {
      throw new Error("Already following this user");
    }

    const follow = await Follow.create({ userId, followingId });

    return res.status(200).json({ data: follow });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const { userId, biography } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      throw new Error("User does not exist");
    }

    if (typeof biography == "string") {
      user.biography = biography;
    }

    await user.save();

    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

const unfollow = async (req, res) => {
  try {
    const { userId } = req.body;
    const followingId = req.params.id;

    const existingFollow = await Follow.find({ userId, followingId });

    if (!existingFollow) {
      throw new Error("Not already following user");
    }

    await existingFollow.remove();

    return res.status(200).json({ data: existingFollow });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

const getFollowers = async (req, res) => {
  try {
    const userId = req.params.id;

    const followers = await Follow.find({ followingId: userId });

    return res.status(200).json({ data: followers });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

const getFollowing = async (req, res) => {
  try {
    const userId = req.params.id;

    const following = await Follow.find({ userId });

    return res.status(200).json({ data: following });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

const getUser = async (req, res) => {
  try {
    const username = req.params.username;

    const user = await User.findOne({ username }).select("-password");

    if (!user) {
      throw new Error("User does not exist");
    }

    const posts = await Post.find({ poster: user._id })
      .populate("poster")
      .sort("-createdAt");

    let likeCount = 0;

    posts.forEach((post) => {
      likeCount += post.likeCount;
    });

    const data = {
      user,
      posts: {
        count: posts.length,
        likeCount,
        data: posts,
      },
    };

    return res.status(200).json(data);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

const getRandomUsers = async (req, res) => {
  try {
    let { size } = req.query;

    const users = await User.find().select("-password");

    const randomUsers = [];

    if (size > users.length) {
      size = users.length;
    }

    const randomIndices = getRandomIndices(size, users.length);

    for (let i = 0; i < randomIndices.length; i++) {
      const randomUser = users[randomIndices[i]];
      randomUsers.push(randomUser);
    }

    return res.status(200).json(randomUsers);
  } catch (err) {
    console.log(err);
    return res.status(400).json({ error: err.message });
  }
};

const getRandomIndices = (size, sourceSize) => {
  const randomIndices = [];
  while (randomIndices.length < size) {
    const randomNumber = Math.floor(Math.random() * sourceSize);
    if (!randomIndices.includes(randomNumber)) {
      randomIndices.push(randomNumber);
    }
  }
  return randomIndices;
};

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  follow,
  unfollow,
  getFollowers,
  getFollowing,
  getUser,
  getRandomUsers,
  updateUser,
};