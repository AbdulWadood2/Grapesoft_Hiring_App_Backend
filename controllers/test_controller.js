// catchAsync
const catchAsync = require("../errorHandlers/catchAsync");
// appError
const appError = require("../errorHandlers/appError");
// model
const testBuilder_model = require("../models/testBuilder_model");
const testQuestion_model = require("../models/testQuestion_model");
const job_model = require("../models/job_model");
const jobApply_model = require("../models/jobApply_model.js");
const submittedTest_model = require("../models/submittedTest_model");
const subscription_model = require("../models/subscription_model.js");
// generate signed url
const { generateSignedUrl } = require("../controllers/awsController.js");
// const
// successMessage
const { successMessage } = require("../successHandlers/successController");
const {
  submittest_question_validation,
} = require("../validation/testBuilder_joi_validation.js");

// method get
// endPoint /api/v1/test
// description Get test for perform
const getTestForPerform = catchAsync(async (req, res, next) => {
  const { jobApplyId } = req.query;
  const jobApply = await jobApply_model.findOne({
    _id: jobApplyId,
    candidateId: req.user.id,
  });
  if (!jobApply) {
    return next(new appError("Job application not found", 400));
  }
  if (jobApply.success == 2) {
    return next(new appError("Job application is rejected", 400));
  }
  if (jobApply.status > 1) {
    return next(new appError("you already take test", 400));
  }
  const job = await job_model.findOne({
    _id: jobApply.jobId,
  });
  if (!job) {
    return next(new appError("Job not found", 400));
  }
  if (!job.status) {
    return next(new appError("Job is not active", 400));
  }
  const subscription = await subscription_model.findOne({
    employerId: job.employerId,
  });
  if (!subscription) {
    return next(new appError("employer have not credits", 400));
  }
  if (subscription.currentPackage.packageStatus.numberOfCredits == 0) {
    return next(new appError("employer have not credits", 400));
  }
  const testBuilder = await testBuilder_model.findOne({
    _id: job.testBuilderId,
  });
  if (!testBuilder) {
    return next(new appError("Test Builder not found", 400));
  }
  const testQuestions = await testQuestion_model.find({
    testBuilderId: testBuilder._id.toString(),
  });
  return successMessage(202, res, "test fetched success", {
    job,
    testBuilder,
    testQuestions,
  });
});

// method post
// endPoint /api/v1/test
// description submit test
const submitTest = catchAsync(async (req, res, next) => {
  const { recordedVideo, jobApplyId, questions } = req.body;
  if (!recordedVideo) {
    return next(new appError("recorded video is required", 400));
  }
  if (!jobApplyId) {
    return next(new appError("job apply id is required", 400));
  }
  const { error, value } = submittest_question_validation.validate({
    questions,
  });
  if (error) {
    const errors = error.details.map((err) => err.message).join(", ");
    return next(new appError(errors, 400));
  }
  const jobApply = await jobApply_model.findOne({
    _id: jobApplyId,
    candidateId: req.user.id,
  });
  if (!jobApply) {
    return next(new appError("Job application not found", 400));
  }
  if (jobApply.success == 2) {
    return next(new appError("Job application is rejected", 400));
  }
  if (jobApply.status > 1) {
    return next(new appError("you already take test", 400));
  }
  const job = await job_model.findOne({
    _id: jobApply.jobId,
  });
  if (!job) {
    return next(new appError("Job not found", 400));
  }
  if (!job.status) {
    return next(new appError("Job is not active", 400));
  }
  const subscription = await subscription_model.findOne({
    employerId: job.employerId,
  });
  if (!subscription) {
    return next(new appError("employer have not credits", 400));
  }
  if (subscription.currentPackage.packageStatus.numberOfCredits <= 0) {
    return next(new appError("employer have not credits", 400));
  }
  await submittedTest_model.create({
    recordedVideo,
    jobApplyId: jobApply._id,
    jobId: jobApply._id,
    candidateId: req.user.id,
    employerId: subscription.employerId,
    ...value,
  });
  jobApply.status = 3;
  await jobApply.save();
  successMessage(202, res, "submit test success fully");
  subscription.currentPackage.packageStatus.numberOfCredits =
    subscription.currentPackage.packageStatus.numberOfCredits - 1;
  await subscription.save();
});

// method get
// endPoint /api/v1/test/submitted
// description get test
const getSubmittedTest = catchAsync(async (req, res, next) => {
  const { jobApplyId, candidateId } = req.query;
  let getSubmittedTest = await submittedTest_model
    .findOne({
      jobApplyId: jobApplyId,
      candidateId: candidateId,
      employerId: req.user.id,
    })
    .lean();
  if (!getSubmittedTest) {
    return next(new appError("test not found", 400));
  }
  const totalQuestion = getSubmittedTest.questions.length;
  getSubmittedTest.totalQuestion = totalQuestion;
  let answeredQuestion = 0;
  getSubmittedTest.questions = await Promise.all(
    getSubmittedTest.questions.map(async (item) => {
      if (item.type == 0) {
        if (item.fileAnswer || item.answer) {
          answeredQuestion++;
          if (item.fileAnswer) {
            [item.fileAnswer] = await generateSignedUrl([item.fileAnswer]);
          }
        }
      }
      if (item.type == 1) {
        if (item.answer) {
          answeredQuestion++;
        }
      }
      if (item.type == 2) {
        if (item.fileAnswer) {
          answeredQuestion++;
          if (item.fileAnswer) {
            [item.fileAnswer] = await generateSignedUrl([item.fileAnswer]);
          }
        }
      }
      return item;
    })
  );
  getSubmittedTest.answeredQuestion = answeredQuestion;
  let status =
    totalQuestion == answeredQuestion ? "Completed" : "Not Completed";
  getSubmittedTest.status = status;
  let comment =
    getSubmittedTest == answeredQuestion
      ? "test submitted and candidate answered all questions"
      : "test complete but candidate not answer all questions";
  getSubmittedTest.comment = comment;
  [getSubmittedTest.recordedVideo] = await generateSignedUrl([
    getSubmittedTest.recordedVideo,
  ]);
  return successMessage(202, res, "submitted test fetched", getSubmittedTest);
});

// method put
// endPoint /api/v1/test/markQuestionCorrectUnCorrect
// description mark Question Correct UnCorrect
const markQuestionCorrectUnCorrect = catchAsync(async (req, res) => {
  const { testId, questionId } = req.body;
  const { isCorrect } = req.body; // Expecting { isCorrect: true/false } in request body

  // Find the test result by ID and update the specific question
  const updatedTestResult = await submittedTest_model.findOneAndUpdate(
    { _id: testId, "questions._id": questionId },
    { $set: { "questions.$.isCorrect": isCorrect } },
    { new: true }
  );

  if (!updatedTestResult) {
    return next(new appError("Test result or question not found", 400));
  }
  return successMessage(202, res, "Question updated successfully");
});

module.exports = {
  getTestForPerform,
  submitTest,
  getSubmittedTest,
  markQuestionCorrectUnCorrect,
};
