const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
  {
    employerId: { type: mongoose.Schema.Types.ObjectId, required: true },
    title: {
      type: String,
      required: true,
    },
    specification: {
      title: { type: String, required: true },
      video: { type: String, default: null },
      docs: { type: String, required: true },
    },
    training: {
      title: { type: String, required: true },
      video: { type: String, required: true },
      docs: { type: String, required: true },
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
    }, // true means public
    coverLetter: {
      type: Boolean,
      default: true,
    },
    cv: {
      type: Boolean,
      default: true,
    },
    aboutVideo: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const job = mongoose.model("job", jobSchema);
module.exports = job;
