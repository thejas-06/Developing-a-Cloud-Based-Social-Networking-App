const User = require("../models/User");
const speakeasy = require("speakeasy");
const QRCode = require("qrcode");

// Generate a secret key and QR code for 2FA setup
const generate2FA = async (req, res) => {
  try {
    const { userId } = req.body;

    // Generate a secret key
    const secret = speakeasy.generateSecret({
      name: `Axon App (${userId})`,
      issuer: "Axon Social Media Platform",
    });

    // Generate QR code URL
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    // Save the secret to the user's record (but don't enable 2FA yet)
    await User.findByIdAndUpdate(userId, {
      twoFactorSecret: secret.base32,
    });

    return res.json({
      success: true,
      secret: secret.base32,
      qrCode: qrCodeUrl,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Verify the 2FA token and enable 2FA
const verify2FA = async (req, res) => {
  try {
    const { userId, token } = req.body;

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    if (!user.twoFactorSecret) {
      throw new Error("2FA not set up for this user");
    }

    // Verify the token
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: "base32",
      token: token,
      window: 2, // Allow a small window for time differences
    });

    if (!verified) {
      throw new Error("Invalid 2FA token");
    }

    // Enable 2FA
    await User.findByIdAndUpdate(userId, {
      twoFactorEnabled: true,
    });

    return res.json({
      success: true,
      message: "2FA enabled successfully",
    });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

// Validate a 2FA token during login
const validate2FA = async (req, res) => {
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

    // Verify the token
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: "base32",
      token: token,
      window: 2, // Allow a small window for time differences
    });

    if (!verified) {
      throw new Error("Invalid 2FA token");
    }

    return res.json({
      success: true,
      message: "2FA token validated successfully",
    });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

// Disable 2FA
const disable2FA = async (req, res) => {
  try {
    const { userId } = req.body;

    // Disable 2FA and clear secret
    await User.findByIdAndUpdate(userId, {
      twoFactorEnabled: false,
      twoFactorSecret: null,
      twoFactorBackupCodes: [],
    });

    return res.json({
      success: true,
      message: "2FA disabled successfully",
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Generate backup codes for 2FA
const generateBackupCodes = async (req, res) => {
  try {
    const { userId } = req.body;

    // Generate 10 backup codes
    const backupCodes = [];
    for (let i = 0; i < 10; i++) {
      const code = speakeasy.generateSecret({
        length: 20,
        name: "backup",
      }).base32;
      backupCodes.push(code);
    }

    // Save backup codes to user
    await User.findByIdAndUpdate(userId, {
      twoFactorBackupCodes: backupCodes,
    });

    return res.json({
      success: true,
      backupCodes: backupCodes,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

module.exports = {
  generate2FA,
  verify2FA,
  validate2FA,
  disable2FA,
  generateBackupCodes,
};