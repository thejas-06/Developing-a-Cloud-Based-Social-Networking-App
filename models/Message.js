const mongoose = require("mongoose");
const filter = require("../util/filter");

const MessageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Types.ObjectId,
      ref: "conversation",
      required: true,
    },
    sender: {
      type: mongoose.Types.ObjectId,
      ref: "user",
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

MessageSchema.pre("save", function (next) {
  if (this.content.length > 0) {
    this.content = filter.clean(this.content);
  }
  
  next();
});

module.exports = mongoose.model("message", MessageSchema);
