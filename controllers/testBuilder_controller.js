// catchAsync
const catchAsync = require("../errorHandlers/catchAsync");
// appError
const appError = require("../errorHandlers/appError");
// model
const testBuilder_model = require("../models/testBuilder_model");
const testQuestion_model = require("../models/testQuestion_model");
// successMessage
const { successMessage } = require("../successHandlers/successController");
// joi validation
const {
  testBuilder_create_validation,
} = require("../validation/testBuilder_joi_validation");

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
    createdTestBuilder: createdTestBuilder,
    createdTestQuestions,
  });
});

module.exports = { createTestBuilder };
