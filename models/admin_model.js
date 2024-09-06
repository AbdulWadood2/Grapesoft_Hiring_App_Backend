const mongoose = require("mongoose");

const admin = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    encryptOTP: {
      type: String,
      default: null,
    },
    refreshToken: [
      {
        type: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

const adminSchema = mongoose.model("admin", admin);
module.exports = adminSchema;
