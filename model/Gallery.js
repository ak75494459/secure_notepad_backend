const mongoose = require("mongoose");

const gallerySchema = new mongoose.Schema({
  imageUrl: { type: [String], required: true },
  user: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
});

module.exports = mongoose.model("Gallery", gallerySchema);
