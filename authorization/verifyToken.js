// catch async
const catchAsync = require("../errorHandlers/catchAsync");
// jwt
const JWT = require("jsonwebtoken");
// app error
const AppError = require("../errorHandlers/appError");
// crypto-js
const CryptoJS = require("crypto-js");
/* models */
const { successMessage } = require("../successHandlers/successController");

const { generateRandomString } = require("../functions/randomDigits_functions");

const signRefreshToken = (uniqueId) => {
  return JWT.sign({ uniqueId }, process.env.JWT_SEC);
};
const signAccessToken = (id, uniqueId) => {
  return JWT.sign({ id, uniqueId }, process.env.JWT_SEC,
    // {
    // expiresIn: process.env.expirydateAccessToken,
    // }
  );
};
const generateAccessTokenRefreshToken = (userId) => {
  const uniqueId = generateRandomString(10);
  const refreshToken = signRefreshToken(uniqueId);
  const accessToken = signAccessToken(userId, uniqueId);
  return { refreshToken, accessToken };
};
// Verify token and admin
const verifyToken = (model) => async (req, res, next) => {
  try {
    let token = req.header("Authorization");
    if (!token) {
      return next(new AppError("you are not login", 400));
    }
    token = token.split(" ");
    token = token[1];
    const payload = JWT.verify(token, process.env.JWT_SEC);
    let user;
    for (let item of model) {
      user = await item.findOne({
        _id: payload.id,
      });
      if (user) {
        break;
      }
    }
    if (!user) {
      return next(new AppError("Invalid user", 401));
    }
    if (user.isBlock) {
      return next(new AppError("you are block", 401));
    }
    if (user.isDeleted) {
      return next(new AppError("user not found", 401));
    }
    const payloadunique = [];
    // Create an array of promises to verify each token
    const verifyTokenPromises = user.refreshToken.map((item) => {
      const payload = JWT.verify(item, process.env.JWT_SEC);
      payloadunique.push(payload.uniqueId);
    });

    // Execute all promises in parallel
    await Promise.all(verifyTokenPromises);
    try {
      const verified = JWT.verify(token, process.env.JWT_SEC);
      user = { id: verified.id };
      req.user = user;
      next();
    } catch (error) {
      console.log(error);
      return next(new AppError("Invalid Token", 401));
    }
  } catch (error) {
    return next(new AppError(error, 401));
  }
};
// refreshToken
const refreshToken = (model) =>
  catchAsync(async (req, res, next) => {
    let refreshToken = req.header("Authorization");
    if (!refreshToken) {
      return next(new AppError("you are not login", 400));
    }
    refreshToken = refreshToken.split(" ");
    refreshToken = refreshToken[1];

    // Retrieve the user from the database based on the refresh token
    let user = await model.findOne({ refreshToken: refreshToken });
    if (!user) {
      throw new Error("you are not login");
    }
    let payload = JWT.verify(refreshToken, process.env.JWT_SEC);
    const newAccessToken = signAccessToken(user._id, payload.uniqueId);
    return successMessage(202, res, "refresh token run successfully", {
      accessToken: newAccessToken,
    });
  });
// otp validation
const otpValidation = catchAsync(async (req, res, next) => {
  const { otp, encryptOpts } = req.query;
  // Decrypt the encrypted options and compare with the user-entered code
  const decrypted = CryptoJS.AES.decrypt(
    decodeURIComponent(encryptOpts),
    process.env.CRYPTO_SEC
  ).toString(CryptoJS.enc.Utf8);
  let otpData;
  try {
    otpData = JSON.parse(decrypted);
  } catch (error) {
    return next(new AppError("Invalid encrypted options format.", 400));
  }

  const { code, expirationTime } = otpData;
  // Check if the OTP has expired
  const currentTime = new Date().getTime();
  if (currentTime > expirationTime) {
    return next(new AppError("Verification code has expired.", 400));
  }

  if (code != otp) {
    return next(new AppError("Invalid verification code.", 400));
  }

  return successMessage(202, res, "Correct OTP", null);
});

module.exports = {
  generateAccessTokenRefreshToken,
  verifyToken,
  refreshToken,
  otpValidation,
};
