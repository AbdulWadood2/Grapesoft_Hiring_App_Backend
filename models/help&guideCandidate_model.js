const mongoose = require("mongoose");

const helpGuideCandidateSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    video: {
      type: String,
      default: null,
    },
    sort: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const employer = mongoose.model("helpguidecandidate", helpGuideCandidateSchema);
module.exports = employer;
