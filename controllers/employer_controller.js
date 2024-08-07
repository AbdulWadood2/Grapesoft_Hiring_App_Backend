// catchAsync
const catchAsync = require("../errorHandlers/catchAsync");
// path node package
const path = require("path");
// clsx node package for readig csv files
const xlsx = require("xlsx");

// appError
const appError = require("../errorHandlers/appError");
// model
const employer_model = require("../models/employer_model");
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
  return successMessage(202, res, "signUp success", {
    accessToken,
    // refreshToken,
    ...JSON.parse(JSON.stringify(user)),
  });
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

const downloadFile = catchAsync(async (req, res, next) => {
  const filename = "Testtemplate.xlsx";
  // Define the folder where your files are stored
  const fileFolder = path.join(__dirname, "../files");

  const filePath = path.join(fileFolder, filename);

  res.download(filePath, (err) => {
    if (err) {
      console.error("File download error:", err);
      res.status(500).send("File download failed.");
    }
  });
});

const addJob = catchAsync(async (req, res, next) => {
  const file = req.file;
  console.log(file);
  if (!file?.path) {
    return next(new appError("Question file is required!", 400));
  }

  const workbook = xlsx.readFile(file.path);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  const questions = xlsx.utils.sheet_to_json(worksheet);
  console.log({ questions });
  const formattedQuestions = questions.map((question) => ({
    questionNumber: question["QUESTION NUMBER"],
    questionType:
      question[
        "QUESTION TYPE (3 options=multiple choice, open or file upload)"
      ],
    questionText: question["QUESTION"],
    answerOptions: String(
      question[
        "Answer Options (for MCQ) or Max. word count (for Open) or Blank/Null (for File)"
      ]
    )
      ? String(
          question[
            "Answer Options (for MCQ) or Max. word count (for Open) or Blank/Null (for File)"
          ]
        ).split(";").length > 1
        ? String(
            question[
              "Answer Options (for MCQ) or Max. word count (for Open) or Blank/Null (for File)"
            ]
              .split(";")
              .map((opt) => opt.trim())
          )
        : ""
      : "",
    maxWordCount: String(
      question[
        "Answer Options (for MCQ) or Max. word count (for Open) or Blank/Null (for File)"
      ]
    )
      ? String(
          question[
            "Answer Options (for MCQ) or Max. word count (for Open) or Blank/Null (for File)"
          ]
        ).split(";").length > 1
        ? ""
        : String(
            question[
              "Answer Options (for MCQ) or Max. word count (for Open) or Blank/Null (for File)"
            ]
          ).split(";")[0] === "undefined"
        ? ""
        : String(
            question[
              "Answer Options (for MCQ) or Max. word count (for Open) or Blank/Null (for File)"
            ]
          ).split(";")[0]
      : "",
    correctAnswers: question["Correct Answer(s)"]
      ? String(question["Correct Answer(s)"])
      : "",
  }));
  req.body.questions = formattedQuestions;
  req.body.employer = req.user._id;
  const jobRecord = await job.create(req.body);
  return successMessage(202, res, "logIn success", {
    ...JSON.parse(JSON.stringify(jobRecord)),
  });
});
const getJobs = catchAsync(async (req, res, next) => {
  let jobs = await job
    .find({ active: true })
    .select("createdAt title active private");
  res.status(200).json({
    status: "success",
    data: jobs,
  });
});
const updateJob = catchAsync(async (req, res, next) => {
  let { id } = req.body;

  const jobDocument = await job.findByIdAndUpdate(id, req.body, { new: true });
  res.status(200).json({
    status: "success",
    data: jobDocument,
  });
});
module.exports = {
  signUpEmployer,
  logInEmployer,
  getEmployerProfile,
  sendForgetOTP,
  verifyOTP,
  resetPassword,
  updateProfile,
  downloadFile,
  addJob,
  getJobs,
  updateJob,
};
