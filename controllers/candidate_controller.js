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
const { employerLogInValidationSchema } = require("../validation/employee_joi_validation");
const job = require("../models/job_model");

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

const logInCandidate = catchAsync(async (req, res, next) => {
  const { error, value } = employerLogInValidationSchema.validate(req.body);
  if (error) {
    const errors = error.details.map((el) => el.message);
    console.log({errors})
    return next(new appError(errors, 400));
  }
  console.log(req.body);
  const candidateExist = await candidate_model.findOne({ email: value.email }).select("+password");
  if(!candidateExist){
    return next(new appError("Incorrect email and password!", 400));
  }

  // Encrypt the password
  let bytes = CryptoJS.AES.decrypt(candidateExist.password, process.env.CRYPTO_SEC);
  let originalToken = bytes.toString(CryptoJS.enc.Utf8);
  console.log({originalToken});
  if(originalToken !== value.password){
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
const getJobs = catchAsync(async(req,res,next)=>{
  let jobs = await job.find({active:true}).select('createdAt title');
  res.status(200).json({
    status:"success",
    data:jobs
  })
})
module.exports = {
  signUpCandidate,
  logInCandidate,
  getJobs
};
