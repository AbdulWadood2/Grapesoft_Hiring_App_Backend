// catchAsync
const catchAsync = require("../errorHandlers/catchAsync");
// path node package
const path = require("path");
// clsx node package for readig csv files
const xlsx = require("xlsx");

// appError
const appError = require("../errorHandlers/appError");
// model
const job_model = require("../models/job_model.js");
const textBuilder_model = require("../models/testBuilder_model.js");
// sign access token
const {
  generateAccessTokenRefreshToken,
} = require("../authorization/verifyToken");
// successMessage
const { successMessage } = require("../successHandlers/successController");
// joi validation
const { jobValidationSchema } = require("../validation/job_joi_validation.js");
// crypto.js
const CryptoJS = require("crypto-js");
// models
const job = require("../models/job_model");
// gererate signed url
const { generateSignedUrl } = require("./awsController");
const {
  getFileName,
  checkDuplicateAwsImgsInRecords,
  checkImageExists,
} = require("../functions/aws_functions.js");

// method post
// endPoint /api/v1/job
// description  create job
const createJob = catchAsync(async (req, res, next) => {
  const { value, error } = jobValidationSchema.validate(req.body);
  if (error) {
    const errors = error.details.map((err) => err.message).join(", ");
    return next(new appError(errors, 400));
  }
  const [
    isSpecificationVideoValid,
    [isSpecificationVideoExist],
    isSpecificationDocsValid,
    [isSpecificationDocsExist],
    isTrainingVideoValid,
    [isTrainingVideoExist],
    isTrainingDocsValid,
    [isTrainingDocsExist],
    isContractVideoValid,
    [isContractVideoExist],
  ] = await Promise.all([
    checkDuplicateAwsImgsInRecords([value.specification.video]),
    checkImageExists([value.specification.video]),
    checkDuplicateAwsImgsInRecords([value.specification.docs]),
    checkImageExists([value.specification.docs]),
    checkDuplicateAwsImgsInRecords([value.training.video]),
    checkImageExists([value.training.video]),
    checkDuplicateAwsImgsInRecords([value.training.docs]),
    checkImageExists([value.training.docs]),
    checkDuplicateAwsImgsInRecords([value.contract.video]),
    checkImageExists([value.contract.video]),
  ]);
  if (!isSpecificationVideoValid.success) {
    return next(new appError("Video specification is already used", 400));
  }
  if (!isSpecificationVideoExist) {
    return next(new appError("Video specification does not exist", 400));
  }
  if (!isSpecificationDocsValid.success) {
    return next(new appError("Docs specification is already used", 400));
  }
  if (!isSpecificationDocsExist) {
    return next(new appError("Docs specification does not exist", 400));
  }
  if (!isTrainingVideoValid.success) {
    return next(new appError("Video training is already used", 400));
  }
  if (!isTrainingVideoExist) {
    return next(new appError("Video training does not exist", 400));
  }
  if (!isTrainingDocsValid.success) {
    return next(new appError("Docs training is already used", 400));
  }
  if (!isTrainingDocsExist) {
    return next(new appError("Docs training does not exist", 400));
  }
  if (!isContractVideoValid.success) {
    return next(new appError("Video contract is already used", 400));
  }
  if (!isContractVideoExist) {
    return next(new appError("Video contract does not exist", 400));
  }

  const testBuilder = await textBuilder_model.findOne({
    _id: value.testBuilderId,
  });
  if (!testBuilder) {
    return next(new appError("Test builder not found", 400));
  }

  const newJob = await job_model.create({
    employerId: req.user.id,
    ...value,
  });
  [newJob.specification.video] = await generateSignedUrl([
    newJob.specification.video,
  ]);
  [newJob.specification.docs] = await generateSignedUrl([
    newJob.specification.docs,
  ]);
  [newJob.training.video] = await generateSignedUrl([newJob.training.video]);
  [newJob.training.docs] = await generateSignedUrl([newJob.training.docs]);
  [newJob.contract.video] = await generateSignedUrl([newJob.contract.video]);
  return successMessage(
    202,
    res,
    `
    Job created successfully
    `,
    newJob
  );
});

module.exports = { createJob };
