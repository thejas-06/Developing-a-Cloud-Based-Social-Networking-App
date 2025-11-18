const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const User = require("../models/User");

const sendMessage = async (req, res) => {
  try {
    const recipientId = req.params.id;
    const { content, userId } = req.body;

    const recipient = await User.findById(recipientId);

    if (!recipient) {
      return res.status(404).json({ error: "Recipient not found" });
    }

    let conversation = await Conversation.findOne({
      recipients: {
        $all: [userId, recipientId],
      },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        recipients: [userId, recipientId],
      });
    }

    await Message.create({
      conversation: conversation._id,
      sender: userId,
      content,
    });

    conversation.lastMessageAt = Date.now();

    await await conversation.save();

    return res.status(201).json({ success: true });
  } catch (err) {
    console.error("Send message error:", err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: "Invalid message data provided" });
    }
    return res.status(500).json({ error: "An error occurred while sending the message" });
  }
};

const getMessages = async (req, res) => {
  try {
    const conversationId = req.params.id;

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    const messages = await Message.find({
      conversation: conversation._id,
    })
      .populate("sender", "-password")
      .sort("-createdAt")
      .limit(12);

    return res.json(messages);
  } catch (err) {
    console.error("Get messages error:", err);
    return res.status(500).json({ error: "An error occurred while fetching messages" });
  }
};

const getConversations = async (req, res) => {
  try {
    const { userId } = req.body;

    const conversations = await Conversation.find({
      recipients: {
        $in: [userId],
      },
    })
      .populate("recipients", "-password")
      .sort("-updatedAt")
      .lean();

    for (let i = 0; i < conversations.length; i++) {
      const conversation = conversations[i];
      for (let j = 0; j < 2; j++) {
        if (conversation.recipients[j]._id != userId) {
          conversation.recipient = conversation.recipients[j];
        }
      }
    }

    return res.json(conversations);
  } catch (err) {
    console.error("Get conversations error:", err);
    return res.status(500).json({ error: "An error occurred while fetching conversations" });
  }
};

module.exports = {
  sendMessage,
  getMessages,
  getConversations,
};
