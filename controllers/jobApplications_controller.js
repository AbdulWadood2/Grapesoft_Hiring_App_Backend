// catchAsync
const catchAsync = require("../errorHandlers/catchAsync");
const appError = require("../errorHandlers/appError");
const {
  helpGuideEmployerValidationSchema,
} = require("../validation/help&guideEmployer_joi_validation");
// model
const jobApply_model = require("../models/jobApply_model");
const job_model = require("../models/job_model");
const candidate_model = require("../models/candidate_model");
const {
  checkDuplicateAwsImgsInRecords,
  checkImageExists,
} = require("../functions/aws_functions");
const { generateSignedUrl } = require("./awsController");
const { successMessage } = require("../successHandlers/successController");

// method post
// endPoint /api/v1/helpguideemployer/
// description create employer help and guide
const getJobApplications = catchAsync(async (req, res, next) => {
  // Get pagination parameters from the query with default values
  const page = parseInt(req.query.page, 10) || 1; // Current page number
  const limit = parseInt(req.query.limit, 10) || 10; // Number of items per page
  const skip = (page - 1) * limit; // Calculate the number of documents to skip

  // Fetch job IDs associated with the employer
  let allJobsOfMine = await job_model
    .find({ employerId: req.user.id })
    .select("_id");

  allJobsOfMine = allJobsOfMine.map((item) => item._id.toString());

  // Count total documents for pagination
  const totalDocuments = await jobApply_model.countDocuments({
    jobId: { $in: allJobsOfMine },
  });

  // Fetch applied jobs with pagination
  let getAllAppliedJobs = await jobApply_model
    .find({ jobId: { $in: allJobsOfMine } })
    .skip(skip)
    .limit(limit)
    .sort({
      createdAt: -1,
    })
    .lean();

  // Map to include signed URLs for CV and about video
  getAllAppliedJobs = await Promise.all(
    getAllAppliedJobs.map(async (item) => {
      const candidate = await candidate_model.findOne({
        _id: item.candidateId,
      });
      if (candidate.avatar)
        [candidate.avatar] = await generateSignedUrl([candidate.avatar]);
      if (candidate.aboutVideo)
        [candidate.aboutVideo] = await generateSignedUrl([
          candidate.aboutVideo,
        ]);
      if (candidate.cv)
        [candidate.cv] = await generateSignedUrl([candidate.cv]);
      item.candidate = candidate;
      if (item.cv) [item.cv] = await generateSignedUrl([item.cv]);
      if (item.aboutVideo)
        [item.aboutVideo] = await generateSignedUrl([item.aboutVideo]);

      return item;
    })
  );

  // Calculate total pages
  const totalPages = Math.ceil(totalDocuments / limit);

  // Prepare response with pagination info
  const paginationInfo = {
    totalPages,
    currentPage: page,
    totalDocuments,
    pageSize: limit,
  };

  return successMessage(202, res, "Help and guide created", {
    jobApplications: getAllAppliedJobs,
    pagination: paginationInfo,
  });
});

// Method: GET
// Endpoint: /api/v1/helpguideemployer/
// Description: Get a single job application by jobId
const getSingleJobApplication = catchAsync(async (req, res, next) => {
  const { jobId } = req.query; // Get jobId from request parameters

  // Check if the job exists and belongs to the employer
  const job = await job_model.findOne({
    _id: jobId,
    employerId: req.user.id, // Ensure the job belongs to the requesting employer
  });

  if (!job) {
    return next(new appError("Job not found or unauthorized", 400));
  }

  // Fetch the job application for the specified jobId
  let jobApplication = await jobApply_model.findOne({ jobId });

  if (!jobApplication) {
    return next(new appError("Job application not found", 400));
  }

  // Generate signed URLs for CV and about video if they exist
  if (jobApplication.cv) {
    [jobApplication.cv] = await generateSignedUrl([jobApplication.cv]);
  }

  if (jobApplication.aboutVideo) {
    [jobApplication.aboutVideo] = await generateSignedUrl([
      jobApplication.aboutVideo,
    ]);
  }
  const candidate = await candidate_model.findOne({
    _id: jobApplication.candidateId,
  });
  if (candidate.avatar)
    [candidate.avatar] = await generateSignedUrl([candidate.avatar]);
  if (candidate.aboutVideo)
    [candidate.aboutVideo] = await generateSignedUrl([candidate.aboutVideo]);
  if (candidate.cv) [candidate.cv] = await generateSignedUrl([candidate.cv]);
  item.candidate = candidate;

  // Respond with the job application details
  return successMessage(
    200,
    res,
    "Job application fetched successfully",
    jobApplication
  );
});

// Method: PUT
// Endpoint: /api/v1/helpguideemployer/editNote
// Description: Update a job application note by jobId
const updateJobApplicationNote = catchAsync(async (req, res, next) => {
  const { jobId } = req.query; // Get jobId from request parameters
  const { note } = req.body; // Get note from request body
  // Check if the job exists and belongs to the employer
  const job = await job_model.findOne({
    _id: jobId,
    employerId: req.user.id, // Ensure the job belongs to the requesting employer
  });
  if (!job) {
    return next(new appError("Job not found or unauthorized", 404));
  }
  // Update the job application note
  let updatedJobApplication = await jobApply_model.updateOne(
    { jobId },
    {
      $set: {
        note: note,
      },
    },
    {
      new: true,
    }
  );
  if (updatedJobApplication.cv) {
    [updatedJobApplication.cv] = await generateSignedUrl([jobApplication.cv]);
  }

  if (updatedJobApplication.aboutVideo) {
    [updatedJobApplication.aboutVideo] = await generateSignedUrl([
      updatedJobApplication.aboutVideo,
    ]);
  }
  const candidate = await candidate_model.findOne({
    _id: updatedJobApplication.candidateId,
  });
  if (candidate.avatar)
    [candidate.avatar] = await generateSignedUrl([candidate.avatar]);
  if (candidate.aboutVideo)
    [candidate.aboutVideo] = await generateSignedUrl([candidate.aboutVideo]);
  if (candidate.cv) [candidate.cv] = await generateSignedUrl([candidate.cv]);
  updateJobApplication = JSON.parse(JSON.stringify(updatedJobApplication));
  updatedJobApplication.candidate = candidate;
  // Respond with the updated job application details
  return successMessage(
    200,
    res,
    "Job application note updated successfully",
    updatedJobApplication
  );
});

// Method PUT
// Endpoint: /api/v1/helpguideemployer/acceptApplication
// Description: acceptApplication


module.exports = {
  getJobApplications,
}; // Export your function
