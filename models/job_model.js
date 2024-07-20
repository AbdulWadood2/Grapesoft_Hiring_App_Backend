const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
  {
    title: { type: String, default: null },
    specification: {
        description:{
            type: String, required: true 
        },
        video: { type: String, required: true },
        pdf: { type: String, required: true },
    },
    training: {
        description:{
            type: String, required: true 
        },
        video: { type: String, required: true },
        pdf: { type: String, required: true },
    },
    contract: {
        description:{
            type: String, required: true 
        },
        file: { type: String, required: true },
    },
    testTime: { type: String, required: true },
    questions:[{
        questionNumber: {
            type: Number,
            required: true,
        },
        questionType: {
            type: String,
            enum: ['Multiple choice', 'Open', 'File'],
            required: true,
        },
        questionText: {
            type: String,
            required: true,
        },
        answerOptions: {
            type: [String],
        },
        maxWordCount: {
            type: Number,
        },
        correctAnswers: {
            type: [String],
        },
    }],
    coverLetter:{
        type: Boolean
    },
    cv:{
        type: Boolean
    },
    aboutVideo:{
        type: Boolean
    }
  },
  {
    timestamps: true,
  }
);

const job = mongoose.model("job", jobSchema);
module.exports = job;
