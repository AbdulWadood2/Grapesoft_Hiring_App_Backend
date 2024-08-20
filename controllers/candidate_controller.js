// catchAsync
const catchAsync = require("../errorHandlers/catchAsync");
// appError
const appError = require("../errorHandlers/appError");
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
} = require("../validation/candidate_joi_validation");
// crypto.js
const CryptoJS = require("crypto-js");
// models
const candidate_model = require("../models/candidate_model");
const job = require("../models/job_model");

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
  if (candidateExist) {
    return next(new appError("you are already signup plz login", 400));
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
  });
  // check user
  if (!user) {
    return next(new appError("error creating candidate", 400));
  }
  const { refreshToken, accessToken } = generateAccessTokenRefreshToken(
    user._id.toString()
  );
  // await candidate_model.findOneAndUpdate(
  //   {
  //     _id: user._id,
  //   },
  //   {
  //     $push: { refreshToken },
  //   }
  // );
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
    return next(new appError("Incorrect email and password!", 400));
  }

  // Encrypt the password
  let bytes = CryptoJS.AES.decrypt(
    candidateExist.password,
    process.env.CRYPTO_SEC
  );
  let originalToken = bytes.toString(CryptoJS.enc.Utf8);
  if (originalToken !== value.password) {
    return next(new appError("Incorrect email and password!", 400));
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
  const employerExist = await candidate_model.findOne({ _id: req.user.id });
  if (!employerExist) {
    return next(new appError("candidate not exist!", 400));
  }

  const avatar = await generateSignedUrl([employerExist.avatar]);
  employerExist.avatar = avatar[0];
  return successMessage(200, res, "Candidate Profile fetched", employerExist);
});

// method post
// endPoint /api/v1/employer/sendForgetOTP
// description get employer profile
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
  employerExist.encryptOTP = encryptedOtp;
  await employerExist.save();
  await new ForgetPasswordEmail({ email }, otp).sendVerificationCode();
  return successMessage(200, res, "sendForgetOTP success");
});

// method post
// endPoint /api/v1/candidate/verifyOTP
// description verify OTP
const verifyOTP = catchAsync(async (req, res, next) => {
  const { otp, email } = req.body;
  const employerExist = await candidate_model.findOne({ email });
  if (!employerExist) {
    return next(new appError("account not found!", 400));
  }
  if (!employerExist.active) {
    return next(new appError("account is blocked!", 400));
  }
  const decryptedOtp = JSON.parse(
    CryptoJS.AES.decrypt(
      employerExist.encryptOTP,
      process.env.CRYPTO_SEC
    ).toString(CryptoJS.enc.Utf8, employerExist.encryptOTP)
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
  if (!candidateExist.active) {
    return next(new appError("account is blocked!", 400));
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
    const avatarInAwsRxists = await checkImageExists([value.avatar]);
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
  [candidate.avatar] = await generateSignedUrl([candidate.avatar]);
  return successMessage(200, res, "profile updated successfully", candidate);
});

const getJobs = catchAsync(async (req, res, next) => {
  let jobs = await job.find({ active: true }).select("createdAt title");
  res.status(200).json({
    status: "success",
    data: jobs,
  });
});
module.exports = {
  signUpCandidate,
  logInCandidate,
  getCandidateProfile,
  sendForgetOTP,
  verifyOTP,
  resetPassword,
  updateProfile,
  getJobs,
};
