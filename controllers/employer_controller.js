// catchAsync
const catchAsync = require("../errorHandlers/catchAsync");

// appError
const appError = require("../errorHandlers/appError");
// model
const employer_model = require("../models/employer_model");
const package_model = require("../models/package_model");
const subscription_model = require("../models/subscription_model");
// sign access token
const {
  generateAccessTokenRefreshToken,
} = require("../authorization/verifyToken");
// successMessage
const { successMessage } = require("../successHandlers/successController");
// joi validation
const {
  employerValidationSchema,
  employerLogInValidationSchema,
  editEmployerProfileSchema,
} = require("../validation/employee_joi_validation");
// crypto.js
const CryptoJS = require("crypto-js");
// models
const job = require("../models/job_model");
// gererate signed url
const { generateSignedUrl } = require("./awsController");
// email sent construction
const ForgetPasswordEmail = require("../emailSender/forgetPassword/ForgetPasswordEmail.js");
const { generateRandomNumber } = require("../functions/randomDigits_functions");
const {
  getFileName,
  checkDuplicateAwsImgsInRecords,
  checkImageExists,
} = require("../functions/aws_functions.js");

// method post
// endPoint /api/v1/employer/signup
// description signup employer
const signUpEmployer = catchAsync(async (req, res, next) => {
  const { error, value } = employerValidationSchema.validate(req.body);
  if (error) {
    const errors = error.details.map((el) => el.message);
    return next(new appError(errors, 400));
  }
  const employerExist = await employer_model.findOne({
    email: value.email,
  });
  if (employerExist) {
    return next(new appError("you are already signup plz login", 400));
  }
  // Encrypt the password
  const encryptedPassword = CryptoJS.AES.encrypt(
    value.password,
    process.env.CRYPTO_SEC
  ).toString();
  // get user
  const user = await employer_model.create({
    ...value,
    password: encryptedPassword,
  });
  // check user
  if (!user) {
    return next(new appError("error creating employer", 400));
  }
  const { refreshToken, accessToken } = generateAccessTokenRefreshToken(
    user._id.toString()
  );
  // await employer_model.findOneAndUpdate(
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
  successMessage(202, res, "signUp success", {
    accessToken,
    // refreshToken,
    ...JSON.parse(JSON.stringify(user)),
  });
  const freePackage = await package_model.findOne({
    type: 0,
  });
  if (freePackage.active) {
    await subscription_model.create({
      title: freePackage.title,
      features: freePackage.features,
      pricePerCredit: freePackage.pricePerCredit,
      numberOfCredits: freePackage.numberOfCredits,
      type: freePackage.type,
      active: freePackage.active,
    });
  }
});

// method post
// endPoint /api/v1/employer/login
// description login employer
const logInEmployer = catchAsync(async (req, res, next) => {
  const { error, value } = employerLogInValidationSchema.validate(req.body);
  if (error) {
    const errors = error.details.map((el) => el.message);
    return next(new appError(errors, 400));
  }
  const employerExist = await employer_model
    .findOne({ email: value.email })
    .select("+password");
  if (!employerExist) {
    return next(new appError("account not found!", 400));
  }

  // Encrypt the password
  let bytes = CryptoJS.AES.decrypt(
    employerExist.password,
    process.env.CRYPTO_SEC
  );
  let originalToken = bytes.toString(CryptoJS.enc.Utf8);
  if (originalToken !== value.password) {
    return next(new appError("Incorrect  password!", 400));
  }
  const { refreshToken, accessToken } = generateAccessTokenRefreshToken(
    employerExist._id.toString()
  );
  return successMessage(202, res, "logIn success", {
    accessToken,
    // refreshToken,
    ...JSON.parse(JSON.stringify(employerExist)),
  });
});

// method get
// endPoint /api/v1/employer
// description get employer profile
const getEmployerProfile = catchAsync(async (req, res, next) => {
  const employerExist = await employer_model.findOne({ _id: req.user.id });
  if (!employerExist) {
    return next(new appError("employer not exist!", 400));
  }

  const avatar = await generateSignedUrl([employerExist.avatar]);
  employerExist.avatar = avatar[0];
  return successMessage(200, res, "getEmployerProfile success", employerExist);
});

// method post
// endPoint /api/v1/employer/sendForgetOTP
// description get employer profile
const sendForgetOTP = catchAsync(async (req, res, next) => {
  const { email } = req.body;
  const employerExist = await employer_model.findOne({ email });
  if (!employerExist) {
    return next(new appError("account not found!", 400));
  }
  if (!employerExist.active) {
    return next(new appError("account is blocked!", 400));
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
// endPoint /api/v1/employer/verifyOTP
// description verify OTP
const verifyOTP = catchAsync(async (req, res, next) => {
  const { otp, email } = req.body;
  const employerExist = await employer_model.findOne({ email });
  if (!employerExist) {
    return next(new appError("account not found!", 400));
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
// endPoint /api/v1/employer/resetPassword
// description reset the password
const resetPassword = catchAsync(async (req, res, next) => {
  const { password, email, otp } = req.body;
  const employerExist = await employer_model.findOne({ email });
  if (!employerExist) {
    return next(new appError("account not found!", 400));
  }
  if (!employerExist.active) {
    return next(new appError("account is blocked!", 400));
  }
  if (!employerExist.encryptOTP) {
    return next(new appError("send otp first", 400));
  }
  const encryptedOtp = employerExist.encryptOTP;
  const decryptOTP = JSON.parse(
    CryptoJS.AES.decrypt(encryptedOtp, process.env.CRYPTO_SEC).toString(
      CryptoJS.enc.Utf8,
      employerExist.encryptOTP
    )
  );
  if (Number(otp) !== Number(decryptOTP.otp)) {
    return next(new appError("invalid OTP!", 400));
  }
  const encryptedPassword = CryptoJS.AES.encrypt(
    password,
    process.env.CRYPTO_SEC
  ).toString();
  employerExist.password = encryptedPassword;
  employerExist.encryptOTP = null;
  await employerExist.save();
  return successMessage(200, res, "password reset successfully");
});

// method put
// endpoint /api/v1/employer/
// description update the employer profile
const updateProfile = catchAsync(async (req, res, next) => {
  const { error, value } = editEmployerProfileSchema.validate(req.body);
  if (error) {
    const errors = error.details.map((el) => el.message);
    return next(new appError(errors, 400));
  }
  let employer = await employer_model.findById(req.user.id);
  if (value.avatar) {
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
    [value.avatar] = await getFileName([value.avatar]);
    if (value.avatar !== employer.avatar) {
      const { message, success } = await checkDuplicateAwsImgsInRecords(
        [value.avatar],
        "employer avatar"
      );
      if (!success) {
        return next(new appError(message, 400));
      }
    }
  }
  console.log(value.avatar);
  employer = await employer_model
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
  [employer.avatar] = await generateSignedUrl([employer.avatar]);
  return successMessage(200, res, "profile updated successfully", employer);
});

// method post
// endpoint /api/v1/employer/changePasswordManually
// description change password manually
const changePasswordManually = catchAsync(async (req, res, next) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword) {
    return next(new appError("old password is required", 400));
  }
  if (!newPassword) {
    return next(new appError("new password is required", 400));
  }
  const employer = await employer_model.findOne({
    _id: req.user.id,
  });
  // dycrypt the password
  let bytes = CryptoJS.AES.decrypt(employer.password, process.env.CRYPTO_SEC);
  let originalPassword = bytes.toString(CryptoJS.enc.Utf8);
  if (originalPassword !== oldPassword) {
    return next(new appError("old password is incorrect", 400));
  }
  // Encrypt the password
  const encryptedPassword = CryptoJS.AES.encrypt(
    newPassword,
    process.env.CRYPTO_SEC
  ).toString();
  employer.password = encryptedPassword;
  await employer.save();
  successMessage(202, res, `your password has been changed successfully`);
});

module.exports = {
  signUpEmployer,
  logInEmployer,
  getEmployerProfile,
  sendForgetOTP,
  verifyOTP,
  resetPassword,
  updateProfile,
  changePasswordManually,
};
