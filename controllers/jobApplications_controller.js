// catchAsync
const catchAsync = require("../errorHandlers/catchAsync");
const appError = require("../errorHandlers/appError");
// model
const jobApply_model = require("../models/jobApply_model");
const job_model = require("../models/job_model");
const candidate_model = require("../models/candidate_model");

const { generateSignedUrl } = require("./awsController");
const { successMessage } = require("../successHandlers/successController");
const AcceptedApplicationEmail = require("../emailSender/jobApplication/acceptedApplicationEmail");

// method post
// endPoint /api/v1/jobApplication/
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
// Endpoint: /api/v1/jobApplication/
// Description: Get a single job application by jobId
const getSingleJobApplication = catchAsync(async (req, res, next) => {
  const { jobApplicationId } = req.query; // Get jobId from request parameters

  // Fetch the job application for the specified jobId
  let jobApplication = await jobApply_model
    .findOne({ _id: jobApplicationId })
    .lean();

  if (!jobApplication) {
    return next(new appError("Job application not found", 400));
  }
  const job = await job_model
    .findOne({
      _id: jobApplication.jobId.toString(),
    })
    .lean();

  if (
    !(
      job.employerId.toString() == req.user.id ||
      jobApplication.candidateId.toString() == req.user.id
    )
  ) {
    return next(
      new appError("You are not the authorize of this application", 400)
    );
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
  const candidate = await candidate_model
    .findOne({
      _id: jobApplication.candidateId,
    })
    .lean();
  candidate.refreshToken = undefined;
  candidate.password = undefined;
  candidate.__v = undefined;
  if (candidate.avatar)
    [candidate.avatar] = await generateSignedUrl([candidate.avatar]);
  if (candidate.aboutVideo)
    [candidate.aboutVideo] = await generateSignedUrl([candidate.aboutVideo]);
  if (candidate.cv) [candidate.cv] = await generateSignedUrl([candidate.cv]);
  jobApplication.candidate = candidate;

  // Respond with the job application details
  return successMessage(
    200,
    res,
    "Job application fetched successfully",
    jobApplication
  );
});

// Method: PUT
// Endpoint: /api/v1/jobApplication/editNote
// Description: Update a job application note by jobId
const updateJobApplicationNote = catchAsync(async (req, res, next) => {
  const { jobId, candidateId } = req.query; // Get jobId from request parameters
  if (!jobId) {
    return next(new appError("jobID is required", 400));
  }
  if (!candidateId) {
    return next(new appError("candidateID is required", 400));
  }
  const { note } = req.body; // Get note from request body
  if (!note) {
    return next(new appError("note is required in body", 400));
  }
  // Check if the job exists and belongs to the employer
  const job = await job_model.findOne({
    _id: jobId,
    employerId: req.user.id, // Ensure the job belongs to the requesting employer
  });
  if (!job) {
    return next(new appError("Job not found or unauthorized", 404));
  }
  // Update the job application note
  let updatedJobApplication = await jobApply_model.findOneAndUpdate(
    { jobId, candidateId },
    {
      $set: {
        note: note,
      },
    },
    {
      new: true,
    }
  );
  updatedJobApplication = JSON.parse(JSON.stringify(updatedJobApplication));
  if (updatedJobApplication.cv) {
    [updatedJobApplication.cv] = await generateSignedUrl([
      updatedJobApplication.cv,
    ]);
  }

  if (updatedJobApplication.aboutVideo) {
    [updatedJobApplication.aboutVideo] = await generateSignedUrl([
      updatedJobApplication.aboutVideo,
    ]);
  }
  const candidate = await candidate_model
    .findOne({
      _id: updatedJobApplication.candidateId,
    })
    .lean();
  candidate.refreshToken = undefined;
  candidate.password = undefined;
  if (candidate.avatar)
    [candidate.avatar] = await generateSignedUrl([candidate.avatar]);
  if (candidate.aboutVideo)
    [candidate.aboutVideo] = await generateSignedUrl([candidate.aboutVideo]);
  if (candidate.cv) [candidate.cv] = await generateSignedUrl([candidate.cv]);
  updatedJobApplication = JSON.parse(JSON.stringify(updatedJobApplication));
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
// Endpoint: /api/v1/jobApplication/acceptApplication
// Description: acceptApplication
const acceptJobApplication = catchAsync(async (req, res, next) => {
  const { jobId, candidateId } = req.query;
  if (!jobId) {
    return next(new appError("jobID is required", 400));
  }
  if (!candidateId) {
    return next(new appError("candidateID is required", 400));
  }

  const job = await job_model.findOne({
    _id: jobId,
    employerId: req.user.id,
  });
  if (!job) {
    return next(new appError("job not found or unauthorize", 400));
  }
  let jobApplication = await jobApply_model.findOne({
    jobId: jobId,
    candidateId,
  });
  if (!(jobApplication.status == 0)) {
    return next(new appError("unauthorize for this action", 400));
  }
  jobApplication.status = 1;
  await jobApplication.save();
  const candidate = await candidate_model
    .findOne({
      _id: candidateId,
    })
    .lean();
  candidate.refreshToken = undefined;
  candidate.password = undefined;
  if (candidate.avatar)
    [candidate.avatar] = await generateSignedUrl([candidate.avatar]);
  if (candidate.aboutVideo)
    [candidate.aboutVideo] = await generateSignedUrl([candidate.aboutVideo]);
  if (candidate.cv) [candidate.cv] = await generateSignedUrl([candidate.cv]);
  jobApplication = JSON.parse(JSON.stringify(jobApplication));
  jobApplication.candidate = candidate;
  successMessage(202, res, "job accepted", jobApplication);
  await new AcceptedApplicationEmail(
    { email: candidate.email },
    {
      candidateEmail: candidate.email,
      jobId: jobApplication.jobId,
      companyName: req.fullUser.company_name,
      candidateName: candidate.first_name + " " + candidate.last_name,
      jobTitle: job.title,
      employerName: req.fullUser.first_name + " " + req.fullUser.last_name,
    }
  ).sendEmail();
});

// Method PUT
// Endpoint: /api/v1/jobApplication/passApplication
// Description: passApplication
const passJobApplication = catchAsync(async (req, res, next) => {
  const { jobId, candidateId } = req.query;
  if (!jobId) {
    return next(new appError("jobID is required", 400));
  }
  if (!candidateId) {
    return next(new appError("candidateID is required", 400));
  }
  const job = await job_model.findOne({
    _id: jobId,
    employerId: req.user.id,
  });
  if (!job) {
    return next(new appError("job not found or unauthorize", 400));
  }
  const jobApplication = await jobApply_model.findOne({
    jobId: jobId,
    candidateId,
  });
  if (!(jobApplication.status == 3)) {
    return next(new appError("unauthorize for action", 400));
  }
  jobApplication.status == 4;
  await jobApplication.save();
  return successMessage(202, res, "job passed");
});

// Method PUT
// Endpoint: /api/v1/jobApplication/ContractApproved
// Description: ContractApproved
const contractApproved = catchAsync(async (req, res, next) => {
  const { jobId, candidateId } = req.query;
  if (!jobId) {
    return next(new appError("jobID is required", 400));
  }
  if (!candidateId) {
    return next(new appError("candidateID is required", 400));
  }
  const job = await job_model.findOne({
    _id: jobId,
    employerId: req.user.id,
  });
  if (!job) {
    return next(new appError("job not found or unauthorize", 400));
  }
  const jobApplication = await jobApply_model.findOne({
    jobId: jobId,
    candidateId,
  });
  if (!(jobApplication.status == 5)) {
    return next(new appError("unauthorize for this action", 400));
  }
  jobApplication.success == 1;
  await jobApplication.save();
  const candidate = await candidate_model
    .findOne({
      _id: candidateId,
    })
    .lean();
  candidate.refreshToken = undefined;
  candidate.password = undefined;
  if (candidate.avatar)
    [candidate.avatar] = await generateSignedUrl([candidate.avatar]);
  if (candidate.aboutVideo)
    [candidate.aboutVideo] = await generateSignedUrl([candidate.aboutVideo]);
  if (candidate.cv) [candidate.cv] = await generateSignedUrl([candidate.cv]);
  jobApplication = JSON.parse(JSON.stringify(jobApplication));
  jobApplication.candidate = candidate;
  return successMessage(202, res, "job passed", jobApplication);
});

// Method PUT
// Endpoint: /api/v1/jobApplication/rejectedApplication
// Description: rejectedApplication
const rejectedApplication = catchAsync(async (req, res, next) => {
  const { jobId, candidateId } = req.query;
  if (!jobId) {
    return next(new appError("jobId is required", 400));
  }
  if (!candidateId) {
    return next(new appError("candidateID is required", 400));
  }
  const job = await job_model.findOne({
    _id: jobId,
    employerId: req.user.id,
  });
  if (!job) {
    return next(new appError("job not found or unauthorize", 400));
  }
  let jobApplication = await jobApply_model.findOne({
    jobId: jobId,
    candidateId,
  });
  if (jobApplication.success == 1) {
    return next(
      new appError("you not able to reject the contracted application", 400)
    );
  }
  jobApplication.success = 2;
  await jobApplication.save();
  const candidate = await candidate_model
    .findOne({
      _id: candidateId,
    })
    .lean();
  candidate.refreshToken = undefined;
  candidate.password = undefined;
  if (candidate.avatar)
    [candidate.avatar] = await generateSignedUrl([candidate.avatar]);
  if (candidate.aboutVideo)
    [candidate.aboutVideo] = await generateSignedUrl([candidate.aboutVideo]);
  if (candidate.cv) [candidate.cv] = await generateSignedUrl([candidate.cv]);
  jobApplication = JSON.parse(JSON.stringify(jobApplication));
  jobApplication.candidate = candidate;
  return successMessage(202, res, "job rejected", jobApplication);
});

// Method DELETE
// Endpoint: /api/v1/jobApplication/deleteApplication
// Description: deleteApplication
const deleteApplication = catchAsync(async (req, res, next) => {
  const { jobId, candidateId } = req.query;
  if (!jobId) {
    return next(new appError("jobID is required", 400));
  }
  if (!candidateId) {
    return next(new appError("candidateID is required", 400));
  }
  const job = await job_model.findOne({ _id: jobId, employerId: req.user.id });
  if (!job) {
    return next(new appError("job not found or unauthorize", 400));
  }
  await jobApply_model.findOneAndDelete({
    jobId: jobId,
    candidateId,
  });
  return successMessage(202, res, "qpplication deleted");
});

// Method GET
// Endpoint: /api/v1/jobApplication/redirectToTest
// Description: redirectToTest
const redirectToTest = catchAsync(async (req, res, next) => {
  const { jobId, candidateEmail } = req.query;
  const job = await job_model.findOne({
    _id: jobId,
  });
  if (!job) {
    return next(new appError("job not found", 400));
  }
  const candidate = await candidate_model.findOne({
    email: candidateEmail,
  });
  if (!candidate) {
    return next(new appError("candidate not found", 400));
  }
  const stringUrlForm = encodeURIComponent(
    JSON.stringify({ jobId, candidateEmail })
  );
  res.redirect(
    `${process.env.FRONTEND_BASE_URL}/completeProfileCandidate/${stringUrlForm}`
  );
});

module.exports = {
  getJobApplications,
  getSingleJobApplication,
  updateJobApplicationNote,
  acceptJobApplication,
  passJobApplication,
  contractApproved,
  rejectedApplication,
  deleteApplication,
  redirectToTest,
};
