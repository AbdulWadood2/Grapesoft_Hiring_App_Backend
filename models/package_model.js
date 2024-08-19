const mongoose = require("mongoose");

const packageSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    features: [
      {
        type: String,
        required: true,
      },
    ],
    pricePerCredit: {
      type: Number,
      default: null,
    },
    numberOfCredits: {
      type: Number,
      required: true,
    },
    type: {
      type: Number,
      default: 1, // 0 free trial , 1 paid
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const candidate = mongoose.model("package", packageSchema);
module.exports = candidate;
