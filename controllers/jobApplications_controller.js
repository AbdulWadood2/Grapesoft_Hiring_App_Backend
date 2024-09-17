// catchAsync
const catchAsync = require("../errorHandlers/catchAsync");
const appError = require("../errorHandlers/appError");
// model
const jobApply_model = require("../models/jobApply_model");
const job_model = require("../models/job_model");
const candidate_model = require("../models/candidate_model");
const employer_model = require("../models/employer_model");
const submittedTest_model = require("../models/submittedTest_model");
const signContract_model = require("../models/contract_model");
const notification_model = require("../models/notification_model");

const { generateSignedUrl } = require("./awsController");
const { successMessage } = require("../successHandlers/successController");
// emails for send
const AcceptedApplicationEmail = require("../emailSender/jobApplication/acceptedApplicationEmail");
const rejectApplicationEmail = require("../emailSender/jobApplication/rejectApplicationEmail");
const signContractApplicationEmail = require("../emailSender/jobApplication/signContractEmail");

const {
  signContractValidationSchema,
} = require("../validation/contract_joi_validation");
const {
  getFileName,
  checkImageExists,
  checkDuplicateAwsImgsInRecords,
} = require("../functions/aws_functions");
const CandidateSignedContractEmail = require("../emailSender/jobApplication/candidateSignContractEmail");

// method post
// endPoint /api/v1/jobApplication/
// description get job applications
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
    isDeleted: { $ne: true },
  });

  // Fetch applied jobs with pagination
  let getAllAppliedJobs = await jobApply_model
    .find({ jobId: { $in: allJobsOfMine }, isDeleted: { $ne: true } })
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

      const urlsToGenerate = [];

      if (candidate.avatar) urlsToGenerate.push(candidate.avatar);
      if (candidate.aboutVideo) urlsToGenerate.push(candidate.aboutVideo);
      if (candidate.cv) urlsToGenerate.push(candidate.cv);
      if (item.cv) urlsToGenerate.push(item.cv);
      if (item.aboutVideo) urlsToGenerate.push(item.aboutVideo);

      const signedUrls = await generateSignedUrl(urlsToGenerate);

      // Assign the signed URLs back to their respective fields
      let index = 0;
      if (candidate.avatar) candidate.avatar = signedUrls[index++];
      if (candidate.aboutVideo) candidate.aboutVideo = signedUrls[index++];
      if (candidate.cv) candidate.cv = signedUrls[index++];
      if (item.cv) item.cv = signedUrls[index++];
      if (item.aboutVideo) item.aboutVideo = signedUrls[index++];

      item.candidate = candidate;

      const jobContract = await job_model
        .findOne({
          _id: item.jobId.toString(),
        })
        .select("contract");
      if (jobContract.contract.docs) {
        item.contractedType = true;
      } else {
        item.contractedType = false;
      }
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
    .findOne({ _id: jobApplicationId, isDeleted: { $ne: true } })
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
  const jobContract = await job_model
    .findOne({
      _id: jobApplication.jobId.toString(),
    })
    .select("contract");
  if (jobContract.contract.docs) {
    jobApplication.contractedType = true;
  } else {
    jobApplication.contractedType = false;
  }
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
    { jobId, candidateId, isDeleted: { $ne: true } },
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
  const { jobId, candidateId, jobApplicationId } = req.query;
  if (!jobId) {
    return next(new appError("jobID is required", 400));
  }
  if (!candidateId) {
    return next(new appError("candidateID is required", 400));
  }
  if (!jobApplicationId) {
    return next(new appError("jobApplicationID is required", 400));
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
    _id: jobApplicationId,
    isDeleted: { $ne: true },
  });
  if (!jobApplication) {
    return next(new appError("Job application not found", 400));
  }
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
  if (candidate.isBlocked) {
    return next(new appError("candidate is blocked", 400));
  }
  if (candidate.isDeleted) {
    return next(new appError("candidate is deleted", 400));
  }
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
      jobApplyId: jobApplication._id,
      companyName: req.fullUser.company_name,
      candidateName: candidate.first_name + " " + candidate.last_name,
      jobTitle: job.title,
      employerName: req.fullUser.first_name + " " + req.fullUser.last_name,
    }
  ).sendEmail();
  await notification_model.create({
    senderId: req.user.id,
    receiverId: candidate._id,
    message: "application accepted",
    description: "your application for " + job.title + " has been accepted",
  });
});

// Method PUT
// Endpoint: /api/v1/jobApplication/passApplication
// Description: passApplication
const passJobApplication = catchAsync(async (req, res, next) => {
  const { jobId, candidateId, jobApplicationId } = req.query;
  if (!jobId) {
    return next(new appError("jobID is required", 400));
  }
  if (!candidateId) {
    return next(new appError("candidateID is required", 400));
  }
  if (!jobApplicationId) {
    return next(new appError("jobApplicationID is required", 400));
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
    _id: jobApplicationId,
    isDeleted: { $ne: true },
  });
  if (!(jobApplication.status == 3)) {
    return next(new appError("unauthorize for action", 400));
  }
  jobApplication.status = 4;
  await jobApplication.save();
  const candidate = await candidate_model
    .findOne({
      _id: candidateId,
    })
    .lean();
  candidate.refreshToken = undefined;
  candidate.password = undefined;
  if (candidate.isBlocked) {
    return next(new appError("candidate is blocked", 400));
  }
  if (candidate.isDeleted) {
    return next(new appError("candidate is deleted", 400));
  }
  if (candidate.avatar)
    [candidate.avatar] = await generateSignedUrl([candidate.avatar]);
  if (candidate.aboutVideo)
    [candidate.aboutVideo] = await generateSignedUrl([candidate.aboutVideo]);
  if (candidate.cv) [candidate.cv] = await generateSignedUrl([candidate.cv]);
  jobApplication = JSON.parse(JSON.stringify(jobApplication));
  jobApplication.candidate = candidate;
  successMessage(202, res, "job passed", jobApplication);
  await new signContractApplicationEmail(
    { email: candidate.email },
    {
      candidateName: candidate.first_name + " " + candidate.last_name,
      companyName: req.fullUser.company_name,
      jobApplyId: jobApplication._id,
    }
  ).sendEmail();
  await notification_model.create({
    senderId: req.user.id,
    receiverId: candidate._id,
    message: "Test Passed",
    description: `Dear ${candidate.first_name} ${candidate.last_name},Congratulations on passing the test for the position of ${job.title}`,
  });
});

// Method PUT
// Endpoint: /api/v1/jobApplication/ContractApproved
// Description: ContractApproved
const contractApproved = catchAsync(async (req, res, next) => {
  const { jobId, candidateId, jobApplicationId } = req.query;
  if (!jobId) {
    return next(new appError("jobID is required", 400));
  }
  if (!candidateId) {
    return next(new appError("candidateID is required", 400));
  }
  if (!jobApplicationId) {
    return next(new appError("jobApplicationID is required", 400));
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
    _id: jobApplicationId,
    isDeleted: { $ne: true },
  });
  if (!(jobApplication.status == 5)) {
    return next(new appError("unauthorize for this action", 400));
  }
  jobApplication.success = 1;
  await jobApplication.save();
  const candidate = await candidate_model
    .findOne({
      _id: candidateId,
    })
    .lean();
  candidate.refreshToken = undefined;
  candidate.password = undefined;
  if (candidate.isBlocked) {
    return next(new appError("candidate is blocked", 400));
  }
  if (candidate.isDeleted) {
    return next(new appError("candidate is deleted", 400));
  }
  if (candidate.avatar)
    [candidate.avatar] = await generateSignedUrl([candidate.avatar]);
  if (candidate.aboutVideo)
    [candidate.aboutVideo] = await generateSignedUrl([candidate.aboutVideo]);
  if (candidate.cv) [candidate.cv] = await generateSignedUrl([candidate.cv]);
  jobApplication = JSON.parse(JSON.stringify(jobApplication));
  jobApplication.candidate = candidate;
  successMessage(202, res, "contract approved", jobApplication);
  await notification_model.create({
    senderId: req.user.id,
    receiverId: candidate._id,
    message: "contract approved",
    description: "contract approved for job " + job.title + " contractApproved",
  });
});

// Method PUT
// Endpoint: /api/v1/jobApplication/rejectedApplication
// Description: rejectedApplication
const rejectedApplication = catchAsync(async (req, res, next) => {
  const { jobId, candidateId, jobApplicationId } = req.query;
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
    _id: jobApplicationId,
    isDeleted: { $ne: true },
  });
  if (!jobApplication) {
    return next(new appError("jobApplication not found", 400));
  }
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
  successMessage(202, res, "job rejected", jobApplication);
  await new rejectApplicationEmail(
    { email: candidate.email },
    {
      companyName: req.fullUser.company_name,
      candidateName: candidate.first_name + " " + candidate.last_name,
      jobTitle: job.title,
    }
  ).sendEmail();
  await notification_model.create({
    senderId: req.user.id,
    receiverId: candidate._id,
    message: "Application Rejected",
    description:
      "Your application for " +
      job.title +
      " at " +
      req.fullUser.company_name +
      " has been rejected",
  });
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
  const application = await jobApply_model.findOne({
    jobId: jobId,
    candidateId,
  });
  application.isDeleted = true;
  if (application.status !== 5) {
    application.success = 2;
  }
  await application.save();
  successMessage(202, res, "application deleted");
  const candidate = await candidate_model.findOne({
    _id: application.candidateId,
  });
  if (application.status !== 5) {
    await new rejectApplicationEmail(
      { email: candidate.email },
      {
        companyName: req.fullUser.company_name,
        candidateName: candidate.first_name + " " + candidate.last_name,
        jobTitle: job.title,
      }
    ).sendEmail();
    await notification_model.create({
      senderId: req.user.id,
      receiverId: candidate._id,
      message: "Application Rejected",
      description:
        "Your application for " +
        job.title +
        " at " +
        req.fullUser.company_name +
        " has been rejected",
    });
  }
});

// Method GET
// Endpoint: /api/v1/jobApplication/redirectToTest
// Description: redirectToTest
const redirectToTest = catchAsync(async (req, res, next) => {
  const { jobApplyId, candidateEmail } = req.query;
  const jobApply = await jobApply_model.findOne({
    _id: jobApplyId,
  });
  if (!jobApply) {
    return next(new appError("job not found", 400));
  }
  const candidate = await candidate_model.findOne({
    email: candidateEmail,
  });
  if (!candidate) {
    return next(new appError("candidate not found", 400));
  }
  const stringUrlForm = encodeURIComponent(
    JSON.stringify({ jobApplyId, candidateEmail })
  );
  if (candidate.password) {
    res.redirect(
      `${process.env.FRONTEND_BASE_URL}/LoginWithPasswordOnly/${stringUrlForm}`
    );
  } else {
    res.redirect(
      `${process.env.FRONTEND_BASE_URL}/completeProfileCandidate/${stringUrlForm}`
    );
  }
});

// Method POST
// Endpoint: /api/v1/jobApplication/signContract
// Description: signContract
const signContract = catchAsync(async (req, res, next) => {
  // Validate request body
  const { error, value } = signContractValidationSchema.validate(req.body);
  if (error) {
    const errors = error.details.map((err) => err.message).join(", ");
    return next(new appError(errors, 400));
  }

  const {
    jobApplyId,
    governmentIdFront,
    governmentIdBack,
    proofOfAddress,
    signature,
    agreedToTerms,
  } = value;
  const jobApplication = await jobApply_model.findOne({
    _id: jobApplyId,
    candidateId: req.user.id,
    isDeleted: { $ne: true },
  });

  if (!jobApplication) {
    return next(new appError("job application not found", 400));
  }
  if (!(jobApplication.status == 4)) {
    return next(new appError("not authorize for sign contract", 400));
  }
  // Check if the images exist in AWS and are not duplicates
  const fileChecks = await Promise.all([
    getFileName([governmentIdFront]),
    checkImageExists([governmentIdFront]),
    checkDuplicateAwsImgsInRecords([governmentIdFront]),
    getFileName([governmentIdBack]),
    checkImageExists([governmentIdBack]),
    checkDuplicateAwsImgsInRecords([governmentIdBack]),
    getFileName([proofOfAddress]),
    checkImageExists([proofOfAddress]),
    checkDuplicateAwsImgsInRecords([proofOfAddress]),
    getFileName([signature]),
    checkImageExists([signature]),
    checkDuplicateAwsImgsInRecords([signature]),
  ]);

  const [
    [govIdFrontFileName],
    [govIdFrontExists],
    govIdFrontDuplicate,
    [govIdBackFileName],
    [govIdBackExists],
    govIdBackDuplicate,
    [proofOfAddressFileName],
    [proofOfAddressExists],
    proofOfAddressDuplicate,
    [signatureFileName],
    [signatureExists],
    signatureDuplicate,
  ] = fileChecks;

  if (
    !govIdFrontExists ||
    !govIdBackExists ||
    !proofOfAddressExists ||
    !signatureExists
  ) {
    return next(new appError("One or more files do not exist in AWS", 400));
  }

  if (
    !govIdFrontDuplicate.success ||
    !govIdBackDuplicate.success ||
    !proofOfAddressDuplicate.success ||
    !signatureDuplicate.success
  ) {
    return next(new appError("One or more files are already used", 400));
  }

  // Create a new contract sign document
  const newContractSign = await signContract_model.create({
    jobApplyId,
    governmentIdFront: govIdFrontFileName,
    governmentIdBack: govIdBackFileName,
    proofOfAddress: proofOfAddressFileName,
    signature: signatureFileName,
    agreedToTerms,
  });
  jobApplication.status = 5;
  await jobApplication.save();

  successMessage(201, res, "Contract signed successfully", newContractSign);

  const [employer, candidate, job] = await Promise.all([
    employer_model.findOne({
      _id: jobApplication.employerId,
    }),
    candidate_model.findOne({
      _id: jobApplication.candidateId,
    }),
    job_model.findOne({
      _id: jobApplication.jobId,
    }),
  ]);
  if (employer.ContractSigned) {
    await new CandidateSignedContractEmail(
      { email: employer.email },
      {
        candidateName: candidate.first_name + " " + candidate.last_name,
        employerName: employer.first_name + " " + employer.last_name,
        jobTitle: job.title,
        jobApplyId: jobApplication._id,
        companyName: employer.company_name,
      }
    ).sendEmail();
  }
  await notification_model.create({
    senderId: candidate._id,
    receiverId: employer._id,
    message: "contract signed",
    description: "Contract signed for job application " + job.title,
  });
});

// Method GET
// Endpoint: /api/v1/jobApplication/signContractRequirements
// Description: Get data for signContract
const getDataForSignContract = catchAsync(async (req, res, next) => {
  const jobApplyId = req.query.jobApplyId;
  const jobApplication = await jobApply_model.findOne({
    _id: jobApplyId.toString(),
    isDeleted: { $ne: true },
  });
  if (!jobApplication) {
    return next(new appError("Job application not found", 404));
  }

  // Check if the job application is in the correct status
  if (jobApplication.status !== 4) {
    return next(
      new appError("Job application is not in the correct status", 400)
    );
  }
  // Get the test
  const submittedTest = await submittedTest_model
    .findOne({
      jobApplyId: jobApplyId,
    })
    .select("createdAt");
  if (!submittedTest) {
    return next(new appError("Test not found", 400));
  }
  const jobContract = await job_model
    .findOne({
      _id: jobApplication.jobId,
    })
    .select("contract");
  [jobContract.contract.docs] = await generateSignedUrl([
    jobContract.contract.docs,
  ]);
  return successMessage(202, res, "contract required data fetched", {
    submittedTest,
    jobContract: jobContract.contract,
  });
});

// method get
// endpoint: /api/v1/jobApplication/signContract
// description: get sign contract
const getSignContract = catchAsync(async (req, res, next) => {
  const jobApplyId = req.query.jobApplyId;
  const jobApplication = await jobApply_model.findOne({
    _id: jobApplyId,
    isDeleted: { $ne: true },
  });
  if (!jobApplication) {
    return next(new appError("Job application not found", 400));
  }
  // Check if the job application is in the correct status
  if (!(jobApplication.status == 5)) {
    return next(new appError("contract not found", 400));
  }
  const contract = await signContract_model.findOne({
    jobApplyId,
  });
  const candidate = await candidate_model
    .findOne({
      _id: jobApplication.candidateId,
    })
    .select("email first_name last_name");
  [contract.governmentIdFront] = await generateSignedUrl([
    contract.governmentIdFront,
  ]);
  [contract.governmentIdBack] = await generateSignedUrl([
    contract.governmentIdBack,
  ]);
  [contract.proofOfAddress] = await generateSignedUrl([
    contract.proofOfAddress,
  ]);
  [contract.signature] = await generateSignedUrl([contract.signature]);
  return successMessage(202, res, "contract required data fetched", {
    ...JSON.parse(JSON.stringify(candidate)),
    ...JSON.parse(JSON.stringify(contract)),
  });
});

// method get
// endpoint: /api/v1/jobApplication/recentActivity
// description: get recent activity
const getRecentActivities = catchAsync(async (req, res, next) => {
  // Get the page and limit from the query parameters, with default values
  const page = parseInt(req.query.page) || 1; // Default to page 1
  const limit = parseInt(req.query.limit) || 10; // Default to 10 items per page

  // Calculate the number of documents to skip
  const skip = (page - 1) * limit;

  // Find job applications with pagination and sort by updatedAt in descending order
  let jobApplications = await jobApply_model
    .find()
    .sort({ updatedAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  // Populate candidate details
  jobApplications = await Promise.all(
    jobApplications.map(async (item) => {
      const candidate = await candidate_model
        .findOne({ _id: item.candidateId })
        .lean();
      item.candidate = candidate;
      return item;
    })
  );

  // Get the total count of documents for pagination info
  const totalJobApplications = await jobApply_model.countDocuments();

  // Calculate total pages
  const totalPages = Math.ceil(totalJobApplications / limit);

  // Return the paginated response
  return successMessage(200, res, "Recent activity fetched", {
    jobApplications,
    pagination: {
      currentPage: page,
      totalPages,
      totalItems: totalJobApplications,
      itemsPerPage: limit,
    },
  });
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
  signContract,
  getDataForSignContract,
  getSignContract,
  getRecentActivities,
};
