// catchAsync
const catchAsync = require("../errorHandlers/catchAsync");
// appError
const appError = require("../errorHandlers/appError");
// model
const testBuilder_model = require("../models/testBuilder_model");
const testQuestion_model = require("../models/testQuestion_model");
const job_model = require("../models/job_model");
const jobdraft_model = require("../models/jobDraft_model.js");
// successMessage
const { successMessage } = require("../successHandlers/successController");
// joi validation
const {
  testBuilder_create_validation,
  testBuilder_update_validation,
  testBuilder_addQuestion_validation,
  testBuilder_editQuestion_validation,
} = require("../validation/testBuilder_joi_validation");
const { boolean } = require("joi");

// method post
// endPoint /api/v1/testBuilder
// description create testBuilder
const createTestBuilder = catchAsync(async (req, res, next) => {
  const { value, error } = testBuilder_create_validation.validate(req.body);
  if (error) {
    const errors = error.details.map((err) => err.message).join(", ");
    return next(new appError(errors, 400));
  }
  const createdTestBuilder = await testBuilder_model.create({
    employerId: req.user.id,
    testName: value.testName,
    testTime: value.testTime,
  });

  value.questions = value.questions.map((testQuestion) => {
    return {
      employerId: req.user.id,
      testBuilderId: createdTestBuilder.id,
      ...testQuestion,
    };
  });
  const createdTestQuestions = await testQuestion_model.insertMany(
    value.questions
  );

  successMessage(202, res, "Test created successfully", {
    ...JSON.parse(JSON.stringify(createdTestBuilder)),
    questions: JSON.parse(JSON.stringify(createdTestQuestions)),
  });
});

// method get
// endPoint /api/v1/testBuilder
// description Get all test builders with pagination
const getAllTestBuilders = catchAsync(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const infinity = req.query.infinity;
  if (infinity !== "true") {
    const skip = (page - 1) * limit;

    let testBuilders = await testBuilder_model
      .find({ employerId: req.user.id })
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean();

    testBuilders = await Promise.all(
      testBuilders.map(async (test) => {
        const testQuestions = await testQuestion_model
          .find({
            testBuilderId: test._id.toString(),
          })
          .sort({
            createdAt: -1,
          });
        test.questions = testQuestions;
        return test;
      })
    );

    const totalTestBuilders = await testBuilder_model.countDocuments({
      employerId: req.user.id,
    });

    return successMessage(200, res, "Test Builders fetched successfully", {
      testBuilders,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(totalTestBuilders / limit),
        totalJobs: totalTestBuilders,
      },
    });
  } else {
    let testBuilders = await testBuilder_model.find({
      employerId: req.user.id,
    });
    return successMessage(200, res, "Test Builders fetched successfully", {
      testBuilders,
    });
  }
});

// method get
// endPoint /api/v1/testBuilder/:id
// description Get a single test builder by ID
const getTestBuilderById = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const testBuilder = await testBuilder_model
    .findOne({
      _id: id,
      employerId: req.user.id,
    })
    .lean();

  if (!testBuilder) {
    return next(new appError("Test Builder not found", 400));
  }
  const testQuestions = await testQuestion_model
    .find({
      testBuilderId: testBuilder._id.toString(),
    })
    .sort({
      createdAt: -1,
    });
  testBuilder.questions = testQuestions;

  successMessage(200, res, "Test Builder fetched successfully", {
    testBuilder,
  });
});

// method put
// endPoint /api/v1/testBuilder/:id
// description Update a test builder by ID
const updateTestBuilder = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { value, error } = testBuilder_update_validation.validate(req.body);

  if (error) {
    const errors = error.details.map((err) => err.message).join(", ");
    return next(new appError(errors, 400));
  }

  const updatedTestBuilder = await testBuilder_model
    .findOneAndUpdate({ _id: id, employerId: req.user.id }, value, {
      new: true,
    })
    .lean();

  if (!updatedTestBuilder) {
    return next(new appError("Test Builder not found", 400));
  }
  const testQuestions = await testQuestion_model.find({
    testBuilderId: updatedTestBuilder._id.toString(),
  });
  updatedTestBuilder.questions = testQuestions;

  successMessage(200, res, "Test Builder updated successfully", {
    ...updatedTestBuilder,
  });
});

// method delete
// endPoint /api/v1/testBuilder/:id
// description Delete a test builder by ID
const deleteTestBuilder = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const deletedTestBuilder = await testBuilder_model.findOneAndDelete({
    _id: id,
    employerId: req.user.id,
  });

  if (!deletedTestBuilder) {
    return next(new appError("Test Builder not found", 400));
  }

  successMessage(202, res, "Test Builder deleted successfully");

  // Optional: Also delete associated test questions
  await testQuestion_model.deleteMany({ testBuilderId: id });

  // Set testBuilderId to null in the job model where it matches the deleted testBuilderId
  await job_model.updateMany({ testBuilderId: id }, { testBuilderId: null });
  await jobdraft_model.updateMany(
    { testBuilderId: id },
    { testBuilderId: null }
  );
});

// method POST
// endPoint /api/v1/testBuilder/question
// description add question
const addQuestion = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { value, error } = testBuilder_addQuestion_validation.validate(
    req.body
  );
  const createdTestBuilder = await testBuilder_model.findOne({
    _id: id,
  });
  if (!createdTestBuilder) {
    return next(new appError("Test Builder not found", 400));
  }
  if (error) {
    const errors = error.details.map((err) => err.message).join(", ");
    return next(new appError(errors, 400));
  }
  value.questions = value.questions.map((testQuestion) => {
    return {
      employerId: req.user.id,
      testBuilderId: createdTestBuilder._id,
      ...testQuestion,
    };
  });
  const createdTestQuestions = await testQuestion_model.insertMany(
    value.questions
  );
  return successMessage(202, res, "question created", createdTestQuestions);
});

// method PUT
// endPoint /api/v1/testBuilder/question
// description edit question
const editQuestion = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { value, error } = testBuilder_editQuestion_validation.validate(
    req.body
  );
  if (error) {
    const errors = error.details.map((err) => err.message).join(", ");
    return next(new appError(errors, 400));
  }
  const editQuestionIs = await testQuestion_model.findOneAndUpdate(
    { _id: id, employerId: req.user.id },
    { $set: value },
    { new: true }
  );
  if (!editQuestionIs) {
    return next(new appError("question not found", 404));
  }
  return successMessage(202, res, "edit question", editQuestionIs);
});

// method DELETE
// endPoint /api/v1/testBuilder/question
// description delete question
const deleteQuestion = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const questionsCounts = await testQuestion_model.countDocuments({
    employerId: req.user.id,
  });
  if (questionsCounts == 1) {
    return next(
      new appError("you can't delete the last question plz edit", 400)
    );
  }
  const deleteQuestionIs = await testQuestion_model.findOneAndDelete({
    _id: id,
    employerId: req.user.id,
  });
  if (!deleteQuestionIs) {
    return next(new appError("question not found", 400));
  }
  successMessage(202, res, `question deleted`);
});

module.exports = {
  createTestBuilder,
  getAllTestBuilders,
  getTestBuilderById,
  updateTestBuilder,
  deleteTestBuilder,
  addQuestion,
  editQuestion,
  deleteQuestion,
};
