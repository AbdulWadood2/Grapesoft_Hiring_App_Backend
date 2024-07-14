const mongoose = require("mongoose");

const candidateSchema = new mongoose.Schema(
  {
    avatar: { type: String, default: null },
    first_name: { type: String, required: true },
    last_name: { type: String, required: true },
    email: { type: String, required: true },
    password: {
      type: String,
      required: true,
    },
    jobApplication: {
      type: Boolean,
      default: false,
    },
    testResult: {
      type: Boolean,
      default: false,
    },
    applicationApprove: {
      type: Boolean,
      default: false,
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

const candidate = mongoose.model("candidate", candidateSchema);
module.exports = candidate;
