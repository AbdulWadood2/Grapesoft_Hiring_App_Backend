// catchAsync
const catchAsync = require("../errorHandlers/catchAsync");
// appError
const appError = require("../errorHandlers/appError");
// model
const candidate_model = require("../models/candidate_model");
// sign access token
const {
  generateAccessTokenRefreshToken,
} = require("../authorization/verifyToken");
// successMessage
const { successMessage } = require("../successHandlers/successController");
// joi validation
const {
  candidateValidationSchema,
} = require("../validation/candidate_joi_validation");
// crypto.js
const CryptoJS = require("crypto-js");

// method post
// endPoint /api/v1/candidate/signup
// description signup candidate
const signUpCandidate = catchAsync(async (req, res, next) => {
  const { error, value } = candidateValidationSchema.validate(req.body);
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

module.exports = {
  signUpCandidate,
};
