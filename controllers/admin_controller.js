const {
  generateAccessTokenRefreshToken,
} = require("../authorization/verifyToken");
const appError = require("../errorHandlers/appError");
const catchAsync = require("../errorHandlers/catchAsync");

// model
const admin_model = require("../models/admin_model");
const subscription_model = require("../models/subscription_model");
const employer_model = require("../models/employer_model");
const candidate_model = require("../models/candidate_model");
const job_model = require("../models/job_model");

const { successMessage } = require("../successHandlers/successController");
// crypto.js
const CryptoJS = require("crypto-js");
const { generateRandomNumber } = require("../functions/randomDigits_functions");
const ForgetPasswordEmail = require("../emailSender/forgetPassword/ForgetPasswordEmail");

// method POST
// route /api/v1/admin/login
// login admin
const loginAdmin = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email) {
    return next(new appError("Please provide your email", 400));
  }
  if (!password) {
    return next(new appError("Please provide your password", 400));
  }
  const admin = await admin_model.findOne({ email });
  if (!admin) return next(new appError("account not found", 400));
  // Encrypt the password
  let bytes = CryptoJS.AES.decrypt(admin.password, process.env.CRYPTO_SEC);
  let originalToken = bytes.toString(CryptoJS.enc.Utf8);
  // Compare the password
  if (originalToken !== password)
    return next(new appError("Invalid  password", 400));
  // Generate JWT token
  const { refreshToken, accessToken } = generateAccessTokenRefreshToken(
    admin._id.toString()
  );
  admin.password = undefined;
  admin.refreshToken = undefined;
  return successMessage(202, res, "login success", {
    accessToken,
    ...JSON.parse(JSON.stringify(admin)),
  });
});

// method GET
// route /api/v1/admin/
// get admin profile
const getAdminProfile = catchAsync(async (req, res, next) => {
  const admin = await admin_model.findById(req.user.id);
  if (!admin) return next(new appError("account not found", 400));
  return successMessage(200, res, "get admin profile success", admin);
});

// method GET
// route /api/v1/admin/statistics
// get admin statistics
const getAdminStatistics = catchAsync(async (req, res, next) => {
  const [subscriptions, employers, candidates, activeJobs, totalJobQuantities] =
    await Promise.all([
      subscription_model.find(),
      employer_model.countDocuments({
        isDeleted: { $ne: true },
      }),
      candidate_model.countDocuments({
        isDeleted: { $ne: true },
      }),
      job_model.countDocuments({
        status: true,
        isDeleted: { $ne: true },
      }),
      job_model.countDocuments({
        isDeleted: { $ne: true },
      }),
    ]);
  // Function to calculate total credits and subscription cost
  const calculateTotalCreditsAndCost = (subscriptions) => {
    let totalCreditsPurchased = 0;
    let totalSubscriptionCost = 0;

    subscriptions.forEach((subscription) => {
      // Add the credits and cost from the current package
      totalCreditsPurchased += subscription.currentPackage.numberOfCredits;
      totalSubscriptionCost +=
        subscription.currentPackage.numberOfCredits *
        subscription.currentPackage.pricePerCredit;

      // Add the credits and cost from the subscription history
      subscription.subscriptionHistory.forEach((history) => {
        totalCreditsPurchased += history.numberOfCredits;
        totalSubscriptionCost +=
          history.numberOfCredits * history.pricePerCredit;
      });
    });

    return {
      totalCreditsPurchased,
      totalSubscriptionCost,
    };
  };

  // Calculate total credits purchased and total subscription cost
  const { totalCreditsPurchased, totalSubscriptionCost } =
    calculateTotalCreditsAndCost(subscriptions);
  // Return the statistics in the response
  return successMessage(202, res, "statistics fetched", {
    totalCreditsPurchased,
    totalSubscriptionCost,
    employers,
    candidates,
    activeJobs,
    totalJobQuantities,
  });
});

// Method POST
// Endpoint /api/v1/admin/sendForgetOTP
// Description: Send a forget password OTP to admin
const sendForgetOTP = catchAsync(async (req, res, next) => {
  const { email } = req.body;

  // Check if the admin exists
  const adminExist = await admin_model.findOne({ email });
  if (!adminExist) {
    return next(new appError("Account not found!", 400));
  }

  // Generate OTP
  const otp = generateRandomNumber(5);

  // Encrypt the OTP
  const encryptedOtp = CryptoJS.AES.encrypt(
    JSON.stringify({ otp, email }),
    process.env.CRYPTO_SEC
  ).toString();

  // Store the encrypted OTP in the admin's record
  adminExist.encryptOTP = encryptedOtp;
  await adminExist.save();

  // Send the OTP via email
  await new ForgetPasswordEmail({ email }, otp).sendVerificationCode();

  // Respond with success
  return successMessage(200, res, "Verification OTP sent successfully");
});

// Method POST
// Endpoint /api/v1/admin/verifyOTP
// Description: Verify OTP for admin
const verifyAdminOTP = catchAsync(async (req, res, next) => {
  const { otp, email } = req.body;

  // Check if the admin exists
  const adminExist = await admin_model.findOne({ email });
  if (!adminExist) {
    return next(new appError("Account not found!", 400));
  }

  // Decrypt the OTP stored in the admin's record
  const decryptedOtp = JSON.parse(
    CryptoJS.AES.decrypt(
      adminExist.encryptOTP,
      process.env.CRYPTO_SEC
    ).toString(CryptoJS.enc.Utf8)
  );

  // Verify the OTP
  if (Number(otp) !== Number(decryptedOtp.otp)) {
    return next(new appError("Invalid OTP!", 400));
  }

  // Respond with success
  return successMessage(200, res, "OTP verified");
});

// Method POST
// Endpoint /api/v1/admin/resetPassword
// Description: Reset the admin password
const resetAdminPassword = catchAsync(async (req, res, next) => {
  const { password, email, otp } = req.body;

  // Check if the admin exists
  const adminExist = await admin_model.findOne({ email });
  if (!adminExist) {
    return next(new appError("Account not found!", 400));
  }

  // Verify if OTP is set
  if (!adminExist.encryptOTP) {
    return next(new appError("Send OTP first", 400));
  }

  // Decrypt and verify the OTP
  const encryptedOtp = adminExist.encryptOTP;
  const decryptOTP = JSON.parse(
    CryptoJS.AES.decrypt(encryptedOtp, process.env.CRYPTO_SEC).toString(
      CryptoJS.enc.Utf8,
      adminExist.encryptOTP
    )
  );
  if (Number(otp) !== Number(decryptOTP.otp)) {
    return next(new appError("Invalid OTP!", 400));
  }

  // Encrypt the new password
  const encryptedPassword = CryptoJS.AES.encrypt(
    password,
    process.env.CRYPTO_SEC
  ).toString();

  // Update the admin's password
  adminExist.password = encryptedPassword;
  adminExist.encryptOTP = null;
  await adminExist.save();

  // Respond with success
  return successMessage(200, res, "Password reset successfully");
});

module.exports = {
  loginAdmin,
  getAdminProfile,
  getAdminStatistics,
  sendForgetOTP,
  verifyAdminOTP,
  resetAdminPassword,
}; // Export your function
