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

// method GET
// endPoint /api/v1/job
// description get job
const getJobs = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 10 } = req.query;

  // Calculate the offset
  const skip = (page - 1) * limit;

  // Fetch the jobs with pagination
  let jobs = await job_model
    .find({ employerId: req.user.id })
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 })
    .lean(); // Assuming you want the newest jobs first

  // Get the total number of jobs to calculate the total pages
  const totalJobs = await job_model.countDocuments({ employerId: req.user.id });
  const totalPages = Math.ceil(totalJobs / limit);
  jobs = await Promise.all(
    jobs.map(async (job) => {
      job.applications = 2;
      job.testCompleted = 1;
      job.contractSigned = 3;
      [job.specification.video] = await generateSignedUrl([
        job.specification.video,
      ]);
      [job.specification.docs] = await generateSignedUrl([
        job.specification.docs,
      ]);
      [job.training.video] = await generateSignedUrl([job.training.video]);
      [job.training.docs] = await generateSignedUrl([job.training.docs]);
      [job.contract.video] = await generateSignedUrl([job.contract.video]);
      return job;
    })
  );
  // Return paginated results
  return successMessage(200, res, "Jobs fetched successfully", {
    jobs,
    pagination: {
      currentPage: Number(page),
      totalPages,
      totalJobs,
    },
  });
});

// method GET
// endPoint /api/v1/job/:id
// description get job by id
const getJobById = catchAsync(async (req, res, next) => {
  const jobId = req.params.id;
  const job = await job_model.findOne({ _id: jobId, employerId: req.user.id });
  if (!job) {
    return next(
      new appError(` Job not found with id ${jobId}. Please try again!`, 400)
    );
  }
  [job.specification.video] = await generateSignedUrl([
    job.specification.video,
  ]);
  [job.specification.docs] = await generateSignedUrl([job.specification.docs]);
  [job.training.video] = await generateSignedUrl([job.training.video]);
  [job.training.docs] = await generateSignedUrl([job.training.docs]);
  [job.contract.video] = await generateSignedUrl([job.contract.video]);
  return successMessage(202, res, `job fetched successfully`, job);
});

// method PUT
// endPoint /api/v1/job/:id
// description edit the job
const editJob = catchAsync(async (req, res, next) => {
  const jobId = req.params.id;
  const { error, value } = jobValidationSchema.validate(req.body);
  if (error) {
    const errors = error.details.map((detail) => detail.message).join(",");
    return next(new appError(errors, 400));
  }
  [value.specification.video] = await getFileName([value.specification.video]);
  [value.specification.docs] = await getFileName([value.specification.docs]);
  [value.training.video] = await getFileName([value.training.video]);
  [value.training.docs] = await getFileName([value.training.docs]);
  [value.contract.video] = await getFileName([value.contract.video]);
  const previousJob = await job_model.findOne({
    _id: jobId,
    employerId: req.user.id,
  });
  if (!previousJob) {
    return next(new appError(`Job not found`, 400));
  }
  const checks = [];

  if (previousJob.specification.video !== value.specification.video) {
    checks.push(
      checkImageExists([value.specification.video])
        .then((exist) => {
          if (!exist[0]) {
            throw new appError(`Specification Video not found`, 400);
          }
          return checkDuplicateAwsImgsInRecords([value.specification.video]);
        })
        .then((result) => {
          if (!result.success) {
            throw new appError(`Specification Video already Used`, 400);
          }
        })
    );
  }

  if (previousJob.specification.docs !== value.specification.docs) {
    checks.push(
      checkImageExists([value.specification.docs])
        .then((exist) => {
          if (!exist[0]) {
            throw new appError(`Specification Docs not found`, 400);
          }
          return checkDuplicateAwsImgsInRecords([value.specification.docs]);
        })
        .then((result) => {
          if (!result.success) {
            throw new appError(`Specification Docs already Used`, 400);
          }
        })
    );
  }

  if (previousJob.training.video !== value.training.video) {
    checks.push(
      checkImageExists([value.training.video])
        .then((exist) => {
          if (!exist[0]) {
            throw new appError(`Training Video not found`, 400);
          }
          return checkDuplicateAwsImgsInRecords([value.training.video]);
        })
        .then((result) => {
          if (!result.success) {
            throw new appError(`Training Video already Used`, 400);
          }
        })
    );
  }

  if (previousJob.training.docs !== value.training.docs) {
    checks.push(
      checkImageExists([value.training.docs])
        .then((exist) => {
          if (!exist[0]) {
            throw new appError(`Training Docs not found`, 400);
          }
          return checkDuplicateAwsImgsInRecords([value.training.docs]);
        })
        .then((result) => {
          if (!result.success) {
            throw new appError(`Training Docs already Used`, 400);
          }
        })
    );
  }

  if (previousJob.contract.video !== value.contract.video) {
    checks.push(
      checkImageExists([value.contract.video])
        .then((exist) => {
          if (!exist[0]) {
            throw new appError(`Contract Video not found`, 400);
          }
          return checkDuplicateAwsImgsInRecords([value.contract.video]);
        })
        .then((result) => {
          if (!result.success) {
            throw new appError(`Contract Video already Used`, 400);
          }
        })
    );
  }

  await Promise.all(checks);

  const testBuilder = await textBuilder_model.findOne({
    _id: value.testBuilderId,
  });
  if (!testBuilder) {
    return next(new appError("Test Builder not found", 400));
  }

  const job = await job_model.findByIdAndUpdate(
    { _id: jobId },
    { $set: value },
    { new: true }
  );
  [job.specification.video] = await generateSignedUrl([
    job.specification.video,
  ]);
  [job.specification.docs] = await generateSignedUrl([job.specification.docs]);
  [job.training.video] = await generateSignedUrl([job.training.video]);
  [job.training.docs] = await generateSignedUrl([job.training.docs]);
  [job.contract.video] = await generateSignedUrl([job.contract.video]);
  return successMessage(202, res, `job updated successfully`, job);
});

// method DELETE
// endPoint /api/v1/job/:id
// description delete the job
const deleteJob = catchAsync(async (req, res, next) => {
  const jobId = req.params.id;
  const job = await job_model.findOneAndDelete({
    _id: jobId,
    employerId: req.user.id,
  });
  if (!job) {
    return next(new appError("Job not found", 400));
  }
  return successMessage(202, res, `job deleted successfully`);
});

module.exports = { createJob, getJobs, getJobById, editJob, deleteJob };
