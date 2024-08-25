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
          enum: [0, 1, 2, 3], // 0: open question, 1: multiple choice, 2: file question, 3: unsolved
        },
        questionText: {
          type: String,
          required: true,
        },
        wordLimit: {
          type: Number,
          default: function () {
            return this.type === 0 ? 1 : null; // Only apply default word limit if type is 0 (open question)
          },
        },
        options: {
          type: [String],
          default: function () {
            return this.type === 1 ? [] : null; // Only initialize as empty array if type is 1 (multiple choice)
          },
        },
        correctAnswer: {
          type: Number,
          default: function () {
            return this.type === 1 ? null : null; // Maintain explicit null default, used in validation logic
          },
        },
        allowFile: {
          type: Boolean,
          default: function () {
            return this.type === 2 ? false : null; // Only initialize if type is 2 (file question)
          },
        },
        answer: {
          type: String,
          default: function () {
            return this.type === 3 ? "" : null; // Ensure an empty string for type 3 (unsolved)
          },
        },
      },
    ],
    answer: {
      type: String,
      default: null,
    },
    isCorrect: {
      type: Boolean,
      default: null,
    },
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
