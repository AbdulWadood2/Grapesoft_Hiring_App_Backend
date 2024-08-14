const mongoose = require("mongoose");

const jobDraftSchema = new mongoose.Schema(
  {
    employerId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      unique: true,
    },
    title: {
      type: String,
      default: null,
    },
    specification: {
      title: { type: String, default: null },
      video: { type: String, default: null },
      docs: { type: String, default: null },
    },
    training: {
      title: { type: String, default: null },
      video: { type: String, default: null },
      docs: { type: String, default: null },
    },
    contract: {
      title: { type: String, default: null },
      docs: { type: String, default: null },
    },
    testBuilderId: { type: mongoose.Schema.Types.ObjectId, default: null },
    status: {
      type: Boolean,
      default: true,
    },
    privateOrPublic: {
      type: Boolean,
      default: true,
    },
    coverLetter: {
      type: Boolean,
      default: null,
    },
    cv: {
      type: Boolean,
      default: null,
    },
    aboutVideo: {
      type: Boolean,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const job = mongoose.model("jobdraft", jobDraftSchema);
module.exports = job;
