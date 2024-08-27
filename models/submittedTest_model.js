const mongoose = require("mongoose");

const testSubmitted = new mongoose.Schema(
  {
    jobApplyId: { type: mongoose.Schema.Types.ObjectId, required: true },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    employerId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    questions: [
      {
        type: {
          type: Number,
          required: true,
          enum: [0, 1, 2], // 0: open question, 1: multiple choice, 2: file question
        },
        questionText: {
          type: String,
          required: true,
        },
        wordLimit: {
          type: Number,
          default: null,
        },
        options: {
          type: [String],
          default: null,
        },
        correctAnswer: {
          type: Number,
          default: null,
        },
        allowFile: {
          type: Boolean,
        },
        fileAnswer: {
          type: String,
          default: null,
        },
        answer: {
          type: String,
          default: null,
        },
        isCorrect: {
          type: Boolean,
          default: null,
        },
      },
    ],
    recordedVideo: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const testSubmittedSchema = mongoose.model("testsubmitted", testSubmitted);
module.exports = testSubmittedSchema;
