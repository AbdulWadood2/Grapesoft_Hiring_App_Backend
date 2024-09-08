const mongoose = require("mongoose");

const stripekeySchema = new mongoose.Schema(
  {
    publishableKey: {
      type: String,
      required: true,
    },
    secretKey: {
      type: String,
      required: true,
    },
    webHookSecret: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const stripekey = mongoose.model("stripekey", stripekeySchema);
module.exports = stripekey;
