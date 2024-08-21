// catchAsync
const catchAsync = require("../errorHandlers/catchAsync");
// appError
const appError = require("../errorHandlers/appError");
// successMessage
const { successMessage } = require("../successHandlers/successController");
// joi validation
const {
  jobApplyValidationSchema,
} = require("../validation/candidate_joi_validation");
// models
const candidate_model = require("../models/candidate_model");
const job_model = require("../models/job_model");
const jobApply_model = require("../models/jobApply_model.js");
// gererate signed url
const { generateSignedUrl } = require("./awsController");
const { generateRandomNumber } = require("../functions/randomDigits_functions");
const {
  getFileName,
  checkImageExists,
  checkDuplicateAwsImgsInRecords,
} = require("../functions/aws_functions.js");

// method post
// endPoint /api/v1/candidateJob/apply/
// description applyJob candidate
const applyJobCandidate = catchAsync(async (req, res, next) => {
  const { error, value } = jobApplyValidationSchema.validate(req.body);

  if (error) {
    const errors = error.details.map((el) => el.message);
    console.log({ errors });
    return next(new appError(errors, 400));
  }
  const [job, candidate] = await Promise.all(
    job_model.findOne({
      _id: value.jobId,
    }),
    candidate_model.findOne({
      email: value.email,
    })
  );

  if (!job) {
    return next(new appError("Job not found", 400));
  }
  if (value.aboutVideo) {
    [value.aboutVideo] = await getFileName([value.aboutVideo]);
    const [aboutVideoInAwsRxists] = await checkImageExists([value.aboutVideo]);
    if (!aboutVideoInAwsRxists) {
      return next(new appError("image not exist in aws", 400));
    }
    if (value.aboutVideo !== candidate.aboutVideo) {
      const { message, success } = await checkDuplicateAwsImgsInRecords(
        [value.aboutVideo],
        "candidate aboutVideo"
      );
      if (!success) {
        return next(new appError(message, 400));
      }
    }
  }
  if (value.cv) {
    [value.cv] = await getFileName([value.cv]);
    const [cvInAwsRxists] = await checkImageExists([value.cv]);
    if (!cvInAwsRxists) {
      return next(new appError("image not exist in aws", 400));
    }
    if (value.cv !== candidate.cv) {
      const { message, success } = await checkDuplicateAwsImgsInRecords(
        [value.cv],
        "candidate cv"
      );
      if (!success) {
        return next(new appError(message, 400));
      }
    }
  }
  if (job.coverLetter) {
    if (!value.coverLetter) {
      return next(new appError("Cover letter is required", 400));
    }
  }
  if (job.cv) {
    if (!value.cv) {
      return next(new appError("Cv is required", 400));
    }
  }
  if (job.aboutVideo) {
    if (!value.aboutVideo) {
      return next(new appError("About Video is required", 400));
    }
  }

  if (!candidate) {
    const newCandidate = await candidate_model.create({
      first_name: value.first_name,
      last_name: value.last_name,
      email: value.email,
      countryOfRecidence: value.countryOfRecidence,
      countryOfBirth: value.countryOfBirth,
      timezone: value.timestamps,
      contactNumber: value.contactNumber,
      aboutVideo: value.aboutVideo,
      cv: value.cv,
      coverLetter: value.coverLetter,
    });
    await jobApply_model.create({
      jobId: value.jobId,
      candidateId: newCandidate._id,
      first_name: value.first_name,
      last_name: value.last_name,
      email: value.email,
      countryOfRecidence: value.countryOfRecidence,
      countryOfBirth: value.countryOfBirth,
      timezone: value.timestamps,
      contactNumber: value.contactNumber,
      aboutVideo: value.aboutVideo,
      cv: value.cv,
      coverLetter: value.coverLetter,
    });
  } else {
    await jobApply_model.create({
      jobId: job._id,
      candidateId: candidate._id,
      first_name: value.first_name,
      last_name: value.last_name,
      email: value.email,
      countryOfRecidence: value.countryOfRecidence,
      countryOfBirth: value.countryOfBirth,
      timezone: value.timestamps,
      contactNumber: value.contactNumber,
      aboutVideo: value.aboutVideo,
      cv: value.cv,
      coverLetter: value.coverLetter,
    });
  }

  // send response
  return successMessage(202, res, "job apply successfully", {});
});

module.exports = {
  applyJobCandidate,
};
