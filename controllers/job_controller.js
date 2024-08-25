// catchAsync
const catchAsync = require("../errorHandlers/catchAsync");

// appError
const appError = require("../errorHandlers/appError");
// model
const job_model = require("../models/job_model.js");
const jobdraft_model = require("../models/jobDraft_model.js");
const textBuilder_model = require("../models/testBuilder_model.js");
const jobApply_model = require("../models/jobApply_model.js");
const submittedTest_model = require("../models/submittedTest_model.js");
// sign access token
const {
  generateAccessTokenRefreshToken,
} = require("../authorization/verifyToken");
// successMessage
const { successMessage } = require("../successHandlers/successController");
// joi validation
const {
  jobValidationSchema,
  jobDraftValidationSchema,
} = require("../validation/job_joi_validation.js");
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
  // Handle each file separately with null checks
  value.specification.video = value.specification.video
    ? (await getFileName([value.specification.video]))[0]
    : null;

  value.specification.docs = value.specification.docs
    ? (await getFileName([value.specification.docs]))[0]
    : null;

  value.training.video = value.training.video
    ? (await getFileName([value.training.video]))[0]
    : null;

  value.training.docs = value.training.docs
    ? (await getFileName([value.training.docs]))[0]
    : null;

  value.contract.docs = value.contract.docs
    ? (await getFileName([value.contract.docs]))[0]
    : null;
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
    isContractPdfValid,
    [isContractPdfExist],
  ] = await Promise.all([
    checkDuplicateAwsImgsInRecords([value.specification.video]),
    checkImageExists([value.specification.video]),
    checkDuplicateAwsImgsInRecords([value.specification.docs]),
    checkImageExists([value.specification.docs]),
    checkDuplicateAwsImgsInRecords([value.training.video]),
    checkImageExists([value.training.video]),
    checkDuplicateAwsImgsInRecords([value.training.docs]),
    checkImageExists([value.training.docs]),
    checkDuplicateAwsImgsInRecords([value.contract.docs]),
    checkImageExists([value.contract.docs]),
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
  if (!isContractPdfValid.success) {
    return next(new appError("Video contract is already used", 400));
  }
  if (!isContractPdfExist) {
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
  [newJob.contract.docs] = await generateSignedUrl([newJob.contract.docs]);
  successMessage(202, res, "Job created successfully", newJob);
  await jobdraft_model.deleteOne({
    employerId: req.user.id,
  });
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
      [job.contract.docs] = await generateSignedUrl([job.contract.docs]);
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
// endPoint /api/v1/job/forCandidate/all
// description get jobs
const jobForCandidateAll = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 10 } = req.query;

  // Calculate the offset
  const skip = (page - 1) * limit;

  // Fetch the jobs with pagination
  let jobs = await job_model
    .find({ privateOrPublic: true })
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 })
    .lean(); // Assuming you want the newest jobs first

  // Get the total number of jobs to calculate the total pages
  const totalJobs = await job_model.countDocuments({ privateOrPublic: true });
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
      [job.contract.docs] = await generateSignedUrl([job.contract.docs]);
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
// privacy public
const getJobById = catchAsync(async (req, res, next) => {
  const jobId = req.params.id;
  const job = await job_model.findOne({ _id: jobId });
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
  job.applications = 2;
  job.testCompleted = 1;
  job.contractSigned = 3;
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
  [value.contract.docs] = await getFileName([value.contract.docs]);
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

  if (previousJob.contract.docs !== value.contract.docs) {
    checks.push(
      checkImageExists([value.contract.docs])
        .then((exist) => {
          if (!exist[0]) {
            throw new appError(`Contract Video not found`, 400);
          }
          return checkDuplicateAwsImgsInRecords([value.contract.docs]);
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
  [job.contract.docs] = await generateSignedUrl([job.contract.docs]);
  job.applications = 2;
  job.testCompleted = 1;
  job.contractSigned = 3;
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
  successMessage(202, res, `job deleted successfully`);
  await jobApply_model.deleteMany({
    jobId: jobId,
  });
  await submittedTest_model.deleteMany({
    jobId: jobId,
  });
});

// method POST
// endPoint /api/v1/job/draft
// description create or edit job draft
const createJobDraft = catchAsync(async (req, res, next) => {
  const { value, error } = jobDraftValidationSchema.validate(req.body);
  // Handle each file separately with null checks
  value.specification.video = value.specification.video
    ? (await getFileName([value.specification.video]))[0]
    : null;

  value.specification.docs = value.specification.docs
    ? (await getFileName([value.specification.docs]))[0]
    : null;

  value.training.video = value.training.video
    ? (await getFileName([value.training.video]))[0]
    : null;

  value.training.docs = value.training.docs
    ? (await getFileName([value.training.docs]))[0]
    : null;

  value.contract.docs = value.contract.docs
    ? (await getFileName([value.contract.docs]))[0]
    : null;

  if (error) {
    const errors = error.details.map((err) => err.message).join(", ");
    return next(new appError(errors, 400));
  }
  const checks = [];

  if (value.specification.video) {
    checks.push(
      checkDuplicateAwsImgsInRecords([value.specification.video]),
      checkImageExists([value.specification.video])
    );
  }

  if (value.specification.docs) {
    checks.push(
      checkDuplicateAwsImgsInRecords([value.specification.docs]),
      checkImageExists([value.specification.docs])
    );
  }

  if (value.training.video) {
    checks.push(
      checkDuplicateAwsImgsInRecords([value.training.video]),
      checkImageExists([value.training.video])
    );
  }

  if (value.training.docs) {
    checks.push(
      checkDuplicateAwsImgsInRecords([value.training.docs]),
      checkImageExists([value.training.docs])
    );
  }

  if (value.contract.docs) {
    checks.push(
      checkDuplicateAwsImgsInRecords([value.contract.docs]),
      checkImageExists([value.contract.docs])
    );
  }

  const results = await Promise.all(checks);

  let resultIndex = 0;

  if (value.specification.video) {
    const [isSpecificationVideoValid, isSpecificationVideoExist] =
      results.slice(resultIndex, resultIndex + 2);
    resultIndex += 2;

    if (!isSpecificationVideoValid.success) {
      return next(new appError("Video specification is already used", 400));
    }
    if (!isSpecificationVideoExist) {
      return next(new appError("Video specification does not exist", 400));
    }
  }

  if (value.specification.docs) {
    const [isSpecificationDocsValid, isSpecificationDocsExist] = results.slice(
      resultIndex,
      resultIndex + 2
    );
    resultIndex += 2;

    if (!isSpecificationDocsValid.success) {
      return next(new appError("Docs specification is already used", 400));
    }
    if (!isSpecificationDocsExist) {
      return next(new appError("Docs specification does not exist", 400));
    }
  }

  if (value.training.video) {
    const [isTrainingVideoValid, isTrainingVideoExist] = results.slice(
      resultIndex,
      resultIndex + 2
    );
    resultIndex += 2;

    if (!isTrainingVideoValid.success) {
      return next(new appError("Video training is already used", 400));
    }
    if (!isTrainingVideoExist) {
      return next(new appError("Video training does not exist", 400));
    }
  }

  if (value.training.docs) {
    const [isTrainingDocsValid, isTrainingDocsExist] = results.slice(
      resultIndex,
      resultIndex + 2
    );
    resultIndex += 2;

    if (!isTrainingDocsValid.success) {
      return next(new appError("Docs training is already used", 400));
    }
    if (!isTrainingDocsExist) {
      return next(new appError("Docs training does not exist", 400));
    }
  }

  if (value.contract.docs) {
    const [isContractPdfValid, isContractPdfExist] = results.slice(
      resultIndex,
      resultIndex + 2
    );

    if (!isContractPdfValid.success) {
      return next(new appError("Contract PDF is already used", 400));
    }
    if (!isContractPdfExist) {
      return next(new appError("Contract PDF does not exist", 400));
    }
  }

  if (value.testBuilderId) {
    const testBuilder = await textBuilder_model.findOne({
      _id: value.testBuilderId,
    });
    if (!testBuilder) {
      return next(new appError("Test builder not found", 400));
    }
  }

  let newJobDraft = await jobdraft_model.findOneAndUpdate(
    {
      employerId: req.user.id,
    },
    {
      ...value,
    },
    {
      new: true,
    }
  );
  if (!newJobDraft) {
    newJobDraft = await jobdraft_model.create({
      employerId: req.user.id,
      ...value,
    });
  }

  if (newJobDraft.specification.video) {
    [newJobDraft.specification.video] = await generateSignedUrl([
      newJobDraft.specification.video,
    ]);
  }

  if (newJobDraft.specification.docs) {
    [newJobDraft.specification.docs] = await generateSignedUrl([
      newJobDraft.specification.docs,
    ]);
  }

  if (newJobDraft.training.video) {
    [newJobDraft.training.video] = await generateSignedUrl([
      newJobDraft.training.video,
    ]);
  }

  if (newJobDraft.training.docs) {
    [newJobDraft.training.docs] = await generateSignedUrl([
      newJobDraft.training.docs,
    ]);
  }

  if (newJobDraft.contract.docs) {
    [newJobDraft.contract.docs] = await generateSignedUrl([
      newJobDraft.contract.docs,
    ]);
  }

  return successMessage(202, res, "Job draft successfully", newJobDraft);
});

// method POST
// endPoint /api/v1/job/getDraft/
// description get job draft
const getJobDraft = catchAsync(async (req, res, next) => {
  const jobDraft = await jobdraft_model.findOne({
    employerId: req.user.id,
  });
  if (!jobDraft) {
    return next(new appError(`no jobDraft`, 400));
  }

  if (jobDraft.specification.video) {
    [jobDraft.specification.video] = await generateSignedUrl([
      jobDraft.specification.video,
    ]);
  }

  if (jobDraft.specification.docs) {
    [jobDraft.specification.docs] = await generateSignedUrl([
      jobDraft.specification.docs,
    ]);
  }

  if (jobDraft.training.video) {
    [jobDraft.training.video] = await generateSignedUrl([
      jobDraft.training.video,
    ]);
  }

  if (jobDraft.training.docs) {
    [jobDraft.training.docs] = await generateSignedUrl([
      jobDraft.training.docs,
    ]);
  }

  if (jobDraft.contract.docs) {
    [jobDraft.contract.docs] = await generateSignedUrl([
      jobDraft.contract.docs,
    ]);
  }
  return successMessage(202, res, `jobDraft fetched successfully`, jobDraft);
});

module.exports = {
  createJob,
  getJobs,
  jobForCandidateAll,
  getJobById,
  editJob,
  deleteJob,
  createJobDraft,
  getJobDraft,
};
