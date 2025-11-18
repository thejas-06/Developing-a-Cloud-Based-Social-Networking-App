const express = require("express");
const router = express.Router();
const userControllers = require("../controllers/userControllers");
const authController = require("../controllers/authController");
const { check } = require("express-validator");
const { verifyToken, verifyRefreshToken } = require("../middleware/auth");
const { registerValidationRules, loginValidationRules, userProfileValidationRules, validate } = require("../middleware/validation");

router.post("/register", registerValidationRules(), validate, userControllers.register);
router.post("/login", loginValidationRules(), validate, userControllers.login);
router.post("/login-2fa", authController.loginWith2FA); // Add 2FA login route
router.post("/refresh-token", verifyRefreshToken, userControllers.refreshToken);
router.post("/logout", userControllers.logout);
router.get("/random", userControllers.getRandomUsers);

router.get("/:username", userControllers.getUser);
router.patch("/:id", verifyToken, userProfileValidationRules(), validate, userControllers.updateUser);

router.post("/follow/:id", verifyToken, userControllers.follow);
router.delete("/unfollow/:id", verifyToken, userControllers.unfollow);

router.get("/followers/:id", userControllers.getFollowers);
router.get("/following/:id", userControllers.getFollowing);

module.exports = router;