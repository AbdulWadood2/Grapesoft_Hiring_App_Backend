// catchAsync
const catchAsync = require("../errorHandlers/catchAsync");
// appError
const appError = require("../errorHandlers/appError");
// email sent construction
const ForgetPasswordEmail = require("../emailSender/forgetPassword/ForgetPasswordEmail.js");
// sign access token
const {
  generateAccessTokenRefreshToken,
} = require("../authorization/verifyToken");
// successMessage
const { successMessage } = require("../successHandlers/successController");
// joi validation
const {
  candidateSignupValidationSchema,
  candidateLogInValidationSchema,
  editProfileValidationSchema,
} = require("../validation/candidate_joi_validation");
// crypto.js
const CryptoJS = require("crypto-js");
// models
const candidate_model = require("../models/candidate_model");
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
// endPoint /api/v1/candidate/signup
// description signup candidate
const signUpCandidate = catchAsync(async (req, res, next) => {
  const { error, value } = candidateSignupValidationSchema.validate(req.body);
  if (error) {
    const errors = error.details.map((el) => el.message);
    return next(new appError(errors, 400));
  }
  const candidateExist = await candidate_model.findOne({
    email: value.email,
  });
  if (candidateExist && candidateExist.password) {
    return next(new appError("you are already signup plz login", 400));
  }
  if (candidateExist && !candidateExist.password) {
    // Encrypt the password
    const encryptedPassword = CryptoJS.AES.encrypt(
      value.password,
      process.env.CRYPTO_SEC
    ).toString();
    // get user
    const user = await candidate_model.findOneAndUpdate(
      {
        email: value.email,
      },
      {
        ...value,
        password: encryptedPassword,
        isverified: true,
      },
      {
        new: true,
      }
    );
    // check user
    if (!user) {
      return next(new appError("error creating candidate", 400));
    }
    const { refreshToken, accessToken } = generateAccessTokenRefreshToken(
      user._id.toString()
    );
    user.password = undefined;
    user.refreshToken = undefined;
    // send response
    return successMessage(202, res, "signUp success", {
      accessToken,
      // refreshToken,
      ...JSON.parse(JSON.stringify(user)),
    });
  }
  // Encrypt the password
  const encryptedPassword = CryptoJS.AES.encrypt(
    value.password,
    process.env.CRYPTO_SEC
  ).toString();
  // get user
  const user = await candidate_model.create({
    ...value,
    password: encryptedPassword,
    isverified: true,
  });
  // check user
  if (!user) {
    return next(new appError("error creating candidate", 400));
  }
  const { refreshToken, accessToken } = generateAccessTokenRefreshToken(
    user._id.toString()
  );
  user.password = undefined;
  user.refreshToken = undefined;
  // send response
  return successMessage(202, res, "signUp success", {
    accessToken,
    // refreshToken,
    ...JSON.parse(JSON.stringify(user)),
  });
});

// method post
// endPoint /api/v1/candidate/login
// description login candidate
const logInCandidate = catchAsync(async (req, res, next) => {
  const { error, value } = candidateLogInValidationSchema.validate(req.body);
  if (error) {
    const errors = error.details.map((el) => el.message);
    console.log({ errors });
    return next(new appError(errors, 400));
  }
  const candidateExist = await candidate_model.findOne({ email: value.email });
  if (!candidateExist) {
    return next(new appError("account not found", 400));
  }
  if (!candidateExist.password) {
    return next(new appError("plz signup", 400));
  }

  // Encrypt the password
  let bytes = CryptoJS.AES.decrypt(
    candidateExist.password,
    process.env.CRYPTO_SEC
  );
  let originalToken = bytes.toString(CryptoJS.enc.Utf8);
  if (originalToken !== value.password) {
    return next(new appError("Incorrect password", 400));
  }
  const { refreshToken, accessToken } = generateAccessTokenRefreshToken(
    candidateExist._id.toString()
  );
  return successMessage(202, res, "logIn success", {
    accessToken,
    // refreshToken,
    ...JSON.parse(JSON.stringify(candidateExist)),
  });
});

// method get
// endPoint /api/v1/candidate
// description get candidate profile
const getCandidateProfile = catchAsync(async (req, res, next) => {
  const candidateExist = await candidate_model.findOne({ _id: req.user.id });
  if (!candidateExist) {
    return next(new appError("candidate not exist!", 400));
  }

  if (candidateExist.avatar) {
    [candidateExist.avatar] = await generateSignedUrl([candidateExist.avatar]);
  }
  if (candidateExist.aboutVideo) {
    [candidateExist.aboutVideo] = await generateSignedUrl([
      candidateExist.aboutVideo,
    ]);
  }
  if (candidateExist.cv) {
    [candidateExist.cv] = await generateSignedUrl([candidateExist.cv]);
  }
  return successMessage(200, res, "Candidate Profile fetched", candidateExist);
});

// method post
// endPoint /api/v1/candidate/sendForgetOTP
// description get candidate profile
const sendForgetOTP = catchAsync(async (req, res, next) => {
  const { email } = req.body;
  const candidateExist = await candidate_model.findOne({ email });
  if (!candidateExist) {
    return next(new appError("account not found!", 400));
  }
  const otp = generateRandomNumber(5);
  const encryptedOtp = CryptoJS.AES.encrypt(
    JSON.stringify({ otp, email }),
    process.env.CRYPTO_SEC
  ).toString();
  candidateExist.encryptOTP = encryptedOtp;
  await candidateExist.save();
  await new ForgetPasswordEmail({ email }, otp).sendVerificationCode();
  return successMessage(200, res, "sendForgetOTP success");
});

// method post
// endPoint /api/v1/candidate/verifyOTP
// description verify OTP
const verifyOTP = catchAsync(async (req, res, next) => {
  const { otp, email } = req.body;
  const candidateExist = await candidate_model.findOne({ email });
  if (!candidateExist) {
    return next(new appError("account not found!", 400));
  }
  const decryptedOtp = JSON.parse(
    CryptoJS.AES.decrypt(
      candidateExist.encryptOTP,
      process.env.CRYPTO_SEC
    ).toString(CryptoJS.enc.Utf8, candidateExist.encryptOTP)
  );
  if (Number(otp) !== Number(decryptedOtp.otp)) {
    return next(new appError("invalid OTP!", 400));
  }
  return successMessage(200, res, "OTP verified");
});

// method post
// endPoint /api/v1/candidate/resetPassword
// description reset the password
const resetPassword = catchAsync(async (req, res, next) => {
  const { password, email, otp } = req.body;
  const candidateExist = await candidate_model.findOne({ email });
  if (!candidateExist) {
    return next(new appError("account not found!", 400));
  }
  if (!candidateExist.encryptOTP) {
    return next(new appError("send otp first", 400));
  }
  const encryptedOtp = candidateExist.encryptOTP;
  const decryptOTP = JSON.parse(
    CryptoJS.AES.decrypt(encryptedOtp, process.env.CRYPTO_SEC).toString(
      CryptoJS.enc.Utf8,
      candidateExist.encryptOTP
    )
  );
  if (Number(otp) !== Number(decryptOTP.otp)) {
    return next(new appError("invalid OTP!", 400));
  }
  const encryptedPassword = CryptoJS.AES.encrypt(
    password,
    process.env.CRYPTO_SEC
  ).toString();
  candidateExist.password = encryptedPassword;
  candidateExist.encryptOTP = null;
  await candidateExist.save();
  return successMessage(200, res, "password reset successfully");
});

// method put
// endpoint /api/v1/candidate/
// description update the employer profile
const updateProfile = catchAsync(async (req, res, next) => {
  const { error, value } = editProfileValidationSchema.validate(req.body);
  if (error) {
    const errors = error.details.map((el) => el.message);
    return next(new appError(errors, 400));
  }
  let candidate = await candidate_model.findById(req.user.id);
  if (value.avatar) {
    [value.avatar] = await getFileName([value.avatar]);
    const [avatarInAwsRxists] = await checkImageExists([value.avatar]);
    if (!avatarInAwsRxists) {
      return next(
        new appError(
          `
        image not exist in aws
        `,
          400
        )
      );
    }
    if (value.avatar !== candidate.avatar) {
      const { message, success } = await checkDuplicateAwsImgsInRecords(
        [value.avatar],
        "candidate avatar"
      );
      if (!success) {
        return next(new appError(message, 400));
      }
    }
  }
  if (value.aboutVideo) {
    [value.aboutVideo] = await getFileName([value.aboutVideo]);
    const [aboutVideoInAwsRxists] = await checkImageExists([value.aboutVideo]);
    if (!aboutVideoInAwsRxists) {
      return next(
        new appError(
          `
        image not exist in aws
        `,
          400
        )
      );
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
      return next(
        new appError(
          `
        image not exist in aws
        `,
          400
        )
      );
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
  candidate = await candidate_model
    .findOneAndUpdate(
      {
        _id: req.user.id,
      },
      {
        ...value,
      },
      {
        new: true,
      }
    )
    .select("-password -refreshToken -encryptOTP");

  if (candidate.avatar) {
    [candidate.avatar] = await generateSignedUrl([candidate.avatar]);
  }
  if (candidate.aboutVideo) {
    [candidate.aboutVideo] = await generateSignedUrl([candidate.aboutVideo]);
  }
  if (candidate.cv) {
    [candidate.cv] = await generateSignedUrl([candidate.cv]);
  }
  return successMessage(200, res, "profile updated successfully", candidate);
});

// method POST
// endpoint /api/v1/candidate/sendVerifyEmailOTP
// description send OTP to verify email
const sendVerifyEmailOTP = catchAsync(async (req, res, next) => {
  const { email } = req.body;

  // Check if the candidate exists
  const candidateExist = await candidate_model.findOne({ email });
  if (!candidateExist) {
    return next(new appError("Account not found!", 400));
  }

  if (candidateExist.isverified) {
    return next(new appError("Account already verified", 400));
  }

  // Generate OTP
  const otp = generateRandomNumber(5);

  // Encrypt the OTP
  const encryptedOtp = CryptoJS.AES.encrypt(
    JSON.stringify({ otp, email }),
    process.env.CRYPTO_SEC
  ).toString();

  // Store the encrypted OTP in the candidate's record
  candidateExist.encryptOTP = encryptedOtp;
  await candidateExist.save();

  // Send the OTP via email
  await new ForgetPasswordEmail({ email }, otp).sendVerificationCode();

  // Respond with success
  return successMessage(200, res, "Verification OTP sent successfully");
});

// method POST
// endpoint /api/v1/candidate/verifyAccountByOTP
// description verify account by OTP
const verifyAccountByOTP = catchAsync(async (req, res, next) => {
  const { otp, email } = req.body;

  // Check if the candidate exists
  const candidateExist = await candidate_model.findOne({ email });
  if (!candidateExist) {
    return next(new appError("Account not found!", 400));
  }

  if (candidateExist.isverified) {
    return next(new appError("Account already verified", 400));
  }

  // Decrypt the OTP stored in the candidate's record
  const decryptedOtp = JSON.parse(
    CryptoJS.AES.decrypt(
      candidateExist.encryptOTP,
      process.env.CRYPTO_SEC
    ).toString(CryptoJS.enc.Utf8)
  );

  // Verify the OTP
  if (Number(otp) !== Number(decryptedOtp.otp)) {
    return next(new appError("Invalid OTP!", 400));
  }

  // Mark the candidate as verified
  candidateExist.isverified = true;
  candidateExist.encryptOTP = null;
  await candidateExist.save();

  // Respond with success
  return successMessage(200, res, "Account verified successfully");
});

// method POST
// endpoint /api/v1/candidate/password
// desc complete profile with password
const completeProfileWithPassword = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email) {
    return next(new appError("email is required", 400));
  }
  if (!password) {
    return next(new appError("password is required", 400));
  }
  const candidate = await candidate_model.findOne({ email });
  if (!candidate) {
    return next(new appError("candidate not found", 400));
  }
  if (!candidate.isverified) {
    return next(new appError("candidate not verified", 400));
  }
  if (candidate.password) {
    return next(new appError("password already set", 400));
  }
  // Encrypt the password
  const encryptedPassword = CryptoJS.AES.encrypt(
    password,
    process.env.CRYPTO_SEC
  ).toString();
  // Update the candidate
  candidate.password = encryptedPassword;
  await candidate.save();
  candidate.password = undefined;
  candidate.refreshToken = undefined;
  candidate.encryptOTP = undefined;
  const { refreshToken, accessToken } = generateAccessTokenRefreshToken(
    candidate._id.toString()
  );
  return successMessage(200, res, "profile updated successfully", {
    accessToken,
    ...JSON.parse(JSON.stringify(candidate)),
  });
});

// method get
// endpoint /api/v1/candidate/dashboard
// desc get candidate dashboard
const candidateDashboard = catchAsync(async (req, res, next) => {
  // Fetch all job applications for the candidate
  const jobApplications = await jobApply_model
    .find({
      candidateId: req.user.id.toString(),
    })
    .select("success status");

  // Calculate the desired counts
  const totalApplications = jobApplications.length;
  const totalTestsTaken = jobApplications.filter(
    (application) => application.status >= 3
  ).length;
  const totalTestsPassed = jobApplications.filter(
    (application) => application.status >= 4
  ).length;
  const totalContractsJobOffers = jobApplications.filter(
    (application) => application.success === 1
  ).length;

  // Create the response object
  const dashboardData = {
    totalApplications,
    totalTestsTaken,
    totalTestsPassed,
    totalContractsJobOffers,
  };

  // Send the response

  return successMessage(200, res, "dashboard fetched", dashboardData);
});

// method get
// endpoint /api/v1/candidate/admin
// desc get candidate admin dashboard
const candidateAdminDashboard = catchAsync(async (req, res, next) => {
  // Get page, limit, and filter from query params, set defaults if not provided
  const page = parseInt(req.query.page, 10) || 1; // Default page is 1
  const limit = parseInt(req.query.limit, 10) || 10; // Default limit is 10
  const filter = parseInt(req.query.filter, 10) || 0; // Default filter is 0 (all)

  // Calculate the number of documents to skip
  const skip = (page - 1) * limit;

  // Build the query filter based on the filter parameter
  let query = {};
  if (filter == 1) {
    // Enabled candidates (isBlocked = false)
    query.isBlocked = { $ne: true };
  } else if (filter == 2) {
    // Disabled candidates (isBlocked = true)
    query.isBlocked = true;
  }
  // If filter is 0, query remains empty to fetch all candidates

  // Fetch all candidates with pagination and filter
  const totalDocuments = await candidate_model.countDocuments({
    ...query,
    isDeleted: { $ne: true },
  }); // Count total documents matching the filter
  let candidates = await candidate_model
    .find({
      ...query,
      isDeleted: { $ne: true },
    })
    .sort({ createdAt: -1 })
    .select("-password -refreshToken")
    .skip(skip)
    .limit(limit);

  // Generate signed URLs for avatars
  candidates = await Promise.all(
    candidates.map(async (candidate) => {
      [candidate.avatar] = await generateSignedUrl([candidate.avatar]);
      return candidate;
    })
  );

  // Calculate total pages
  const totalPages = Math.ceil(totalDocuments / limit);

  // Create the response object with pagination and filter info
  const response = {
    candidates,
    pagination: {
      totalDocuments,
      totalPages,
      currentPage: page,
      pageSize: limit,
    },
  };

  // Send the response
  return successMessage(202, res, "Candidates fetched successfully", response);
});

// method put
// endpoint /api/v1/candidate/toggleBlock
// description Toggle the blocked status of a candidate
const toggleCandidateBlockStatus = catchAsync(async (req, res, next) => {
  // Get the candidate ID from the query parameter
  const { id } = req.query;

  // Check if the ID is provided
  if (!id) {
    return next(new appError("Candidate ID is required", 400));
  }

  // Find the candidate by ID
  const candidate = await candidate_model.findById(id);

  // If candidate not found, return an error
  if (!candidate) {
    return next(new appError("Candidate not found", 404));
  }

  // Toggle the isBlocked status using the ! operator
  candidate.isBlocked = !candidate.isBlocked;

  // Save the updated candidate document
  await candidate.save();

  // Send a success message with the updated candidate status
  return successMessage(200, res, "Candidate status toggled successfully", {
    isBlocked: candidate.isBlocked,
  });
});

// Method DELETE
// Endpoint /api/v1/candidate?id={candidateId}
// Description: Soft delete a candidate by setting isDeleted to true using a query parameter
const softDeleteCandidateByQuery = catchAsync(async (req, res, next) => {
  const { id } = req.query; // Extract candidate ID from query parameters

  if (!id) {
    return next(new appError("Candidate ID is required", 400)); // Return error if ID is not provided
  }

  // Find and update the candidate's isDeleted field to true
  const candidate = await candidate_model.findByIdAndUpdate(
    id,
    { isDeleted: true },
    { new: true }
  );

  // If candidate not found, send a 404 error
  if (!candidate) {
    return next(new appError("Candidate not found", 400));
  }

  // Send success response
  return successMessage(200, res, "Candidate soft deleted successfully");
});

// Method PUT
// Endpoint /api/v1/candidate/update-email
// Description: Update candidate email by candidate_id
const updateCandidateEmailById = catchAsync(async (req, res, next) => {
  const { candidateId, newEmail } = req.body; // Extract candidate ID and new email from request body

  // Validate request body parameters
  if (!candidateId || !newEmail) {
    return next(new appError("Candidate ID and new email are required", 400));
  }

  // Check if the new email already exists for a different candidate
  const existingCandidate = await candidate_model.findOne({
    email: newEmail,
    _id: { $ne: candidateId }, // Exclude the current candidate by ID
  });

  if (existingCandidate) {
    return next(
      new appError("Email already exists for another candidate", 400)
    );
  }

  // Update the candidate's email
  const candidate = await candidate_model.findByIdAndUpdate(
    candidateId,
    { email: newEmail },
    { new: true, runValidators: true }
  );

  // If candidate not found, send a 404 error
  if (!candidate) {
    return next(new appError("Candidate not found", 400));
  }

  // Send success response
  return successMessage(
    200,
    res,
    "Candidate email updated successfully",
    candidate
  );
});

module.exports = {
  signUpCandidate,
  logInCandidate,
  getCandidateProfile,
  sendForgetOTP,
  verifyOTP,
  resetPassword,
  updateProfile,
  sendVerifyEmailOTP,
  verifyAccountByOTP,
  completeProfileWithPassword,
  candidateDashboard,
  candidateAdminDashboard,
  toggleCandidateBlockStatus,
  softDeleteCandidateByQuery,
  updateCandidateEmailById,
};
