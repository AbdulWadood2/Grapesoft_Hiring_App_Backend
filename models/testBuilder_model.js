const mongoose = require("mongoose");

const testSchema = new mongoose.Schema(
  {
    employerId: { type: mongoose.Schema.Types.ObjectId, required: true },
    testName: {
      type: String,
      required: true,
    },
    testTime: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const employer = mongoose.model("test", testSchema);
module.exports = employer;
