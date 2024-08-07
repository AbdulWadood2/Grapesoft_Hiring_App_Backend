const express = require("express");
const {
  signUpEmployer,
  logInEmployer,
  downloadFile,
  addJob,
  getJobs,
  updateJob,
  getEmployerProfile,
  sendForgetOTP,
  verifyOTP,
  resetPassword,
  updateProfile,
} = require("../controllers/employer_controller");
const authenticationController = require("../controllers/authentication_controller");
const multer = require("multer");
const employer = require("../models/employer_model");
const { verifyToken } = require("../authorization/verifyToken");
const route = express.Router();
const upload = multer({ dest: "api/v1/employer/" });

/**
 * @swagger
 * /api/v1/employer/signup:
 *   post:
 *     summary: Signup a new employer
 *     description: Creates a new employer account and returns the access and refresh tokens.
 *     tags:
 *       - Employer/account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - first_name
 *               - last_name
 *               - email
 *               - password
 *               - company_name
 *             properties:
 *               first_name:
 *                 type: string
 *                 description: The first name of the employer.
 *               last_name:
 *                 type: string
 *                 description: The last name of the employer.
 *               email:
 *                 type: string
 *                 format: email
 *                 description: The email address of the employer.
 *               password:
 *                 type: string
 *                 format: password
 *                 description: The password for the employer's account.
 *               company_name:
 *                 type: string
 *                 description: The company name of the employer.
 *     responses:
 *       201:
 *         description: Signup success
 */
route.post("/signup", signUpEmployer);

/**
 * @swagger
 * /api/v1/employer/login:
 *   post:
 *     summary: Login a new employer
 *     description: Creates a new employer account and returns the access and refresh tokens.
 *     tags:
 *       - Employer/account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: The email address of the employer.
 *               password:
 *                 type: string
 *                 format: password
 *                 description: The password for the employer's account.
 *     responses:
 *       201:
 *         description: Signup success
 */
route.post("/login", logInEmployer);

/**
 * @swagger
 * /api/v1/employer:
 *   get:
 *     summary: Get employer profile
 *     description: Retrieve the profile of the employer using the employer ID from the authenticated user.
 *     tags:
 *       - Employer/account
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved employer profile
 */
route.get("/", verifyToken([employer]), getEmployerProfile);

/**
 * @swagger
 * /api/v1/employer/sendForgetOTP:
 *   post:
 *     summary: Send a forget password OTP to employer
 *     tags:
 *       - Employer/account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 description: The employer's email address
 *                 example: employer@example.com
 *     responses:
 *       200:
 *         description: OTP sent successfully
 */
route.post("/sendForgetOTP", sendForgetOTP);

/**
 * @swagger
 * /api/v1/employer/verifyOTP:
 *   post:
 *     summary: Verify OTP
 *     description: Verify the OTP sent to the employer's email.
 *     tags:
 *       - Employer/account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - otp
 *               - email
 *             properties:
 *               otp:
 *                 type: number
 *                 example: 123456"
 *                 description: The OTP sent to the employer's email
 *               email:
 *                 type: string
 *                 example: "example@example.com"
 *                 description: The employer's email address
 *     responses:
 *       200:
 *         description: OTP verified
 */
route.post("/verifyOTP", verifyOTP);

/**
 * @swagger
 * /api/v1/employer/resetPassword:
 *   post:
 *     summary: Reset the password
 *     description: Allows an employer to reset their password using email and OTP.
 *     tags:
 *       - Employer/account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *               - email
 *               - otp
 *             properties:
 *               email:
 *                 type: string
 *                 description: The employer's email.
 *                 example: employer@example.com
 *               otp:
 *                 type: string
 *                 description: The OTP sent to the employer's email.
 *                 example: 123456
 *               password:
 *                 type: string
 *                 description: The new password to be set.
 *                 example: NewStrongPassword123!
 *     responses:
 *       200:
 *         description: Password reset successfully.
 */
route.post("/resetPassword", resetPassword);

/**
 * @swagger
 * /api/v1/employer/:
 *   put:
 *     summary: Update the employer profile
 *     description: Updates the employer profile with the provided information.
 *     tags:
 *       - Employer/account
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: uri
 *                 nullable: true
 *                 description: URL of the employer's avatar image
 *               first_name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 255
 *                 description: First name of the employer
 *               last_name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 255
 *                 description: Last name of the employer
 *               company_name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 255
 *                 description: Company name of the employer
 *               NewApplication:
 *                 type: boolean
 *                 description: Indicates if there is a new application
 *               TestTaken:
 *                 type: boolean
 *                 description: Indicates if the test is taken
 *               ContractSigned:
 *                 type: boolean
 *                 description: Indicates if the contract is signed
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
route.put("/", verifyToken([employer]), updateProfile);

/**
 * @swagger
 * /api/v1/employer/downloadFile:
 *   get:
 *     summary: Download a file
 *     description: Downloads a file from the server.
 *     tags:
 *       - Employer/account
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: File downloaded successfully
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 */
route.get("/downloadFile", downloadFile);

/**
 * @swagger
 * /api/v1/employer/addJob:
 *   post:
 *     summary: Add a new job
 *     description: Adds a new job with the specified details.
 *     tags:
 *       - Employer/account
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 default: null
 *               specification[description]:
 *                 type: string
 *                 required: true
 *               specification[video]:
 *                 type: string
 *                 required: true
 *               specification[pdf]:
 *                 type: string
 *                 required: true
 *               training[description]:
 *                 type: string
 *                 required: true
 *               training[video]:
 *                 type: string
 *                 required: true
 *               training[pdf]:
 *                 type: string
 *                 required: true
 *               contract[description]:
 *                 type: string
 *                 required: true
 *               contract[file]:
 *                 type: string
 *                 required: true
 *               testTime:
 *                 type: string
 *                 required: true
 *               file:
 *                 type: string
 *                 format: binary
 *               coverLetter:
 *                 type: boolean
 *               cv:
 *                 type: boolean
 *               aboutVideo:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Job added successfully
 */
route.post(
  "/addJob",
  upload.single("file"),
  authenticationController.protect(employer),
  addJob
);

/**
 * @swagger
 * /api/v1/employer/getJobs:
 *   get:
 *     summary: Retrieve job listings
 *     description: Retrieves a list of job openings available to employer.
 *     tags:
 *       - Employer/account
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of job openings
 */

route.get("/getJobs", authenticationController.protect(employer), getJobs);

/**
 * @swagger
 * /api/v1/employer/updateJobs:
 *   patch:
 *     summary: Update job listings
 *     description: Updates the specified fields for a list of job openings available to the employer.
 *     tags:
 *       - Employer/account
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - active
 *               - private
 *               - id
 *             properties:
 *               id:
 *                 type: string
 *                 description: The id of the job.
 *               active:
 *                 type: boolean
 *                 description: The active status of the job.
 *               private:
 *                 type: boolean
 *                 description: The private status of the job.
 *     responses:
 *       200:
 *         description: Job listings updated successfully
 */
route.patch(
  "/updateJobs",
  authenticationController.protect(employer),
  updateJob
);

module.exports = route;
