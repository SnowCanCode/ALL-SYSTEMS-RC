const mongoose = require("mongoose");

const blacklistSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  username: { type: String, default: "Unknown" },
  reason: { type: String, default: "No reason provided" },
  blacklistedBy: { type: String, default: "Unknown" },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Blacklist", blacklistSchema);