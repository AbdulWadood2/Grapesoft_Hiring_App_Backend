const mongoose = require("mongoose");

const testSchema = new mongoose.Schema(
  {
    employerId: { type: mongoose.Schema.Types.ObjectId, required: true },
    testBuilderId: { type: mongoose.Schema.Types.ObjectId, required: true },
    type: {
      type: Number,
      required: true,
      enum: [0, 1, 2],
    }, // 0 open question , 1 multiple choice , 2 file question
    questionText: {
      type: String,
      required: true,
    },
    wordLimit: {
      type: Number,
      default: 1,
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
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const employer = mongoose.model("testquestion", testSchema);
module.exports = employer;
