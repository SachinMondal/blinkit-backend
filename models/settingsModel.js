const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema({
  deliveryCharge: {
    type: Number,
    required: true,
    default: 0,
  },
  handlingCharge: {
    type: Number,
    required: true,
    default: 0,
  },
   lastUpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

module.exports = mongoose.model("Settings", settingsSchema);
