const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    mobileNo: {
      type: String,
      unique: false,
    },
    role: {
      type: String,
      enum: ["admin", "user"],
      default: "user",
    },
    verified: {
      type: Boolean,
      default: false,
    },
    locationPin: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        default: [0, 0],
      },
    },
    location: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);


userSchema.index({ locationPin: "2dsphere" });

module.exports = mongoose.model("User", userSchema);
