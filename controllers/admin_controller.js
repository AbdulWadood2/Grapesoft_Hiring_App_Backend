const {
  generateAccessTokenRefreshToken,
} = require("../authorization/verifyToken");
const appError = require("../errorHandlers/appError");
const catchAsync = require("../errorHandlers/catchAsync");

// model
const admin_model = require("../models/admin_model");
const { successMessage } = require("../successHandlers/successController");
// crypto.js
const CryptoJS = require("crypto-js");

// method POST
// route /api/v1/admin/
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

module.exports = { loginAdmin }; // Export your function
