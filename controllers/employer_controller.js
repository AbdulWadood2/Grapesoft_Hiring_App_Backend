// catchAsync
const catchAsync = require("../errorHandlers/catchAsync");

// appError
const appError = require("../errorHandlers/appError");
// model
const employer_model = require("../models/employer_model");
const package_model = require("../models/package_model");
const subscription_model = require("../models/subscription_model");
const job_model = require("../models/job_model.js");
const jobApply_model = require("../models/jobApply_model.js");
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

// method get
// endpoint /api/v1/employer/dashboard
// description employer dashboard
const getEmployerDashboard = catchAsync(async (req, res, next) => {
  const [jobs, jobApplications] = await Promise.all([
    job_model
      .find({
        employerId: req.user.id,
        isDeleted: false,
      })
      .select("status privateOrPublic"),
    jobApply_model
      .find({
        employerId: req.user.id,
      })
      .select("status success"),
  ]);

  // Calculate jobs statistics
  const totalJobs = jobs.length;
  const activeJobs = jobs.filter((job) => job.status === true).length;
  const publicJobs = jobs.filter((job) => job.privateOrPublic === true).length;
  const privateJobs = jobs.filter(
    (job) => job.privateOrPublic === false
  ).length;

  // Calculate job applications statistics
  const totalJobApplications = jobApplications.length;
  const testCompletedApplications = jobApplications.filter(
    (application) => application.status >= 3
  ).length;
  const contractSignedApplications = jobApplications.filter(
    (application) => application.status >= 5
  ).length;
  const rejectedApplications = jobApplications.filter(
    (application) => application.success === 2
  ).length;

  // Construct the response
  const response = {
    jobs: {
      total: totalJobs,
      active: activeJobs,
      public: publicJobs,
      private: privateJobs,
    },
    jobApplications: {
      total: totalJobApplications,
      testCompleted: testCompletedApplications,
      contractSigned: contractSignedApplications,
      rejected: rejectedApplications,
    },
  };

  // Send the response
  return successMessage(200, res, "Employer dashboard data fetched", response);
});

// Method GET
// Endpoint /api/v1/employer/admin
// Description: Get employer admin dashboard with current package details
const getEmployerAdminDashboard = catchAsync(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const filter = parseInt(req.query.filter, 10) || 0;

  const skip = (page - 1) * limit;

  let query = { isDeleted: { $ne: true } }; // Default query to exclude deleted employers
  if (filter === 1) {
    query.isBlocked = { $ne: true }; // Enabled employers
  } else if (filter === 2) {
    query.isBlocked = true; // Disabled employers
  }

  const totalDocuments = await employer_model.countDocuments({
    ...query,
    isDeleted: { $ne: true },
  });
  let employers = await employer_model
    .find({
      ...query,
      isDeleted: { $ne: true },
    })
    .sort({ createdAt: -1 })
    .select("-password -refreshToken -encryptOTP")
    .skip(skip)
    .limit(limit)
    .lean();
  employers = await Promise.all(
    employers.map(async (employer) => {
      const currentSubscription = await subscription_model.findOne({
        employerId: employer._id,
      });
      employer.currentSubscription = currentSubscription;
      [employer.avatar] = await generateSignedUrl([employer.avatar]);
      return employer;
    })
  );

  const totalPages = Math.ceil(totalDocuments / limit);

  const response = {
    employers,
    pagination: {
      totalDocuments,
      totalPages,
      currentPage: page,
      pageSize: limit,
    },
  };

  return successMessage(202, res, "Employers fetched successfully", response);
});

// Method PUT
// Endpoint /api/v1/employer/toggle-status
// Description: Enable or disable an employer by toggling the isBlocked status
const toggleEmployerStatus = catchAsync(async (req, res, next) => {
  const employerId = req.query.employerId;

  if (!employerId) {
    return next(new appError("Employer ID is required", 400));
  }

  const employer = await employer_model.findById(employerId);
  if (!employer) {
    return next(new appError("Employer not found", 400));
  }

  employer.isBlocked = !employer.isBlocked;
  await employer.save();

  return successMessage(
    200,
    res,
    `Employer ${employer.isBlocked ? "disabled" : "enabled"} successfully`,
    employer
  );
});

// Method DELETE
// Endpoint /api/v1/employer/delete
// Description: Soft delete an employer by setting isDeleted to true
const deleteEmployer = catchAsync(async (req, res, next) => {
  const employerId = req.query.employerId;

  if (!employerId) {
    return next(new appError("Employer ID is required", 400));
  }

  const employer = await employer_model.findById(employerId);
  if (!employer) {
    return next(new appError("Employer not found", 400));
  }

  employer.isDeleted = true;
  await employer.save();

  return successMessage(200, res, "Employer deleted successfully");
});

// Method PUT
// Endpoint /api/v1/employer/update
// Description: Update employer email and credits
const updateEmployerEmailAndCredits = catchAsync(async (req, res, next) => {
  const { employerId, newEmail, credits } = req.body;

  if (!employerId || !newEmail || !credits) {
    return next(
      new appError("Employer ID and new email and credits are required", 400)
    );
  }

  const existingEmployer = await employer_model.findOne({
    email: newEmail,
    _id: { $ne: employerId },
  });

  if (existingEmployer) {
    return next(new appError("Email already exists for another employer", 400));
  }

  const employer = await employer_model.findById(employerId);
  if (!employer) {
    return next(new appError("Employer not found", 400));
  }

  employer.email = newEmail;
  const subscription = await subscription_model.findOne({
    employerId: employerId,
  });
  if (credits > subscription.currentPackage.numberOfCredits) {
    subscription.currentPackage.numberOfCreditsAdminCustomAdded +=
      credits - subscription.currentPackage.numberOfCredits;
    subscription.currentPackage.numberOfCredits = credits;
  } else if (credits < subscription.currentPackage.numberOfCredits) {
    subscription.currentPackage.numberOfCreditsAdminCustomRemove +=
      subscription.currentPackage.numberOfCredits - credits;
    subscription.currentPackage.numberOfCredits = credits;
  }

  await employer.save();
  await subscription.save();

  return successMessage(
    200,
    res,
    "Employer email and credits updated successfully",
    employer
  );
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
  getEmployerDashboard,
  getEmployerAdminDashboard,
  toggleEmployerStatus,
  deleteEmployer,
  updateEmployerEmailAndCredits,
};
