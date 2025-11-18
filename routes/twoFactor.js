const express = require("express");
const router = express.Router();
const twoFactorController = require("../controllers/twoFactorController");
const { verifyToken } = require("../middleware/auth");

// Generate 2FA secret and QR code
router.post("/generate", verifyToken, twoFactorController.generate2FA);

// Verify 2FA token and enable 2FA
router.post("/verify", verifyToken, twoFactorController.verify2FA);

// Validate 2FA token during login
router.post("/validate", twoFactorController.validate2FA);

// Disable 2FA
router.post("/disable", verifyToken, twoFactorController.disable2FA);

// Generate backup codes
router.post("/backup-codes", verifyToken, twoFactorController.generateBackupCodes);

module.exports = router;