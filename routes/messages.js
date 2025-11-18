const express = require("express");
const router = express.Router();
const messageController = require("../controllers/messageController");
const { verifyToken } = require("../middleware/auth");
const { messageValidationRules, validate } = require("../middleware/validation");

router.get("/", verifyToken, messageController.getConversations);
router.post("/:id", verifyToken, messageValidationRules(), validate, messageController.sendMessage);
router.get("/:id", verifyToken, messageController.getMessages);

module.exports = router;