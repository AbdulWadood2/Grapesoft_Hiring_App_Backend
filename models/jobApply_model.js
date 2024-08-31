const { required } = require("joi");
const mongoose = require("mongoose");

const jobApplySchema = new mongoose.Schema(
  {
    employerId: { type: mongoose.Schema.Types.ObjectId, required: true },
    candidateId: { type: mongoose.Schema.Types.ObjectId, required: true },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    first_name: { type: String, required: true },
    last_name: { type: String, required: true },
    email: { type: String, required: true },
    countryOfRecidence: {
      type: String,
      default: null,
    },
    countryOfBirth: {
      type: String,
      default: null,
    },
    timezone: {
      type: String,
      default: null,
    },
    contactNumber: {
      type: String,
      default: null,
    },
    availabilityDate: {
      type: Date,
      default: null,
    },
    aboutVideo: {
      type: String,
      default: null,
    },
    cv: {
      type: String,
      default: null,
    },
    coverLetter: {
      type: String,
      default: null,
    },
    status: {
      type: Number,
      default: 0,
    },
    // 0 pending
    // 1 accepted
    // 3 test taken
    // 4 passed
    // 5 contract signed
    success: {
      type: Number,
      default: 0, // 0 in progress , 1 contract approved , 2 rejected
    },
    note: {
      type: String,
      default: null,
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

const job = mongoose.model("jobapply", jobApplySchema);
module.exports = job;
