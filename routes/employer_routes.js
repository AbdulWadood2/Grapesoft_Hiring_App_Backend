const express = require("express");
const {
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
  verifySignup,
} = require("../controllers/employer_controller");
const multer = require("multer");
// model
const employer = require("../models/employer_model");
const admin_model = require("../models/admin_model");

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
 * /api/v1/employer/verifySignup:
 *   post:
 *     summary: Verify employer signup using OTP.
 *     description: This endpoint is used to verify the employer's signup process by checking the OTP sent to the provided email. If the OTP matches, the employer's account will be marked as verified. A free package will also be assigned if available.
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
 *               email:
 *                 type: string
 *                 description: Email address of the employer.
 *                 example: employer@example.com
 *               otp:
 *                 type: string
 *                 description: OTP sent to the employer's email.
 *                 example: "123456"
 *     responses:
 *       202:
 *         description: Signup successfully verified.
 */
route.post("/verifySignup", verifySignup);

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
 * /api/v1/employer/changePasswordManually:
 *   post:
 *     summary: Change employer password manually
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
 *               oldPassword:
 *                 type: string
 *                 description: The current password of the employer
 *                 example: oldPassword123
 *               newPassword:
 *                 type: string
 *                 description: The new password to set
 *                 example: newPassword456
 *     responses:
 *       202:
 *         description: Password changed successfully
 */
route.post(
  "/changePasswordManually",
  verifyToken([employer]),
  changePasswordManually
);

/**
 * @swagger
 * /api/v1/employer/dashboard:
 *   get:
 *     summary: Get employer dashboard data
 *     description: Fetches statistics related to the employer's jobs and job applications.
 *     tags:
 *       - Employer/account
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Employer dashboard data fetched successfully.
 */
route.get("/dashboard", verifyToken([employer]), getEmployerDashboard);

/**
 * @swagger
 * /api/v1/employer/admin:
 *   get:
 *     summary: Get employers with current package details
 *     description: Fetch employers with pagination, filters, and current subscription package details.
 *     tags:
 *       - Employer/admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of records per page
 *       - in: query
 *         name: filter
 *         schema:
 *           type: integer
 *           default: 0
 *           enum: [0, 1, 2]
 *         description: 0 - All, 1 - Enabled, 2 - Disabled
 *     responses:
 *       202:
 *         description: Employers fetched successfully
 */
route.get("/admin", verifyToken([admin_model]), getEmployerAdminDashboard);

/**
 * @swagger
 * /api/v1/employer/toggle-status:
 *   put:
 *     summary: Enable or disable an employer
 *     description: Toggle the isBlocked status of an employer.
 *     tags:
 *       - Employer/admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: employerId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the employer to enable or disable.
 *     responses:
 *       200:
 *         description: Employer status toggled successfully
 */
route.put("/toggle-status", verifyToken([admin_model]), toggleEmployerStatus);

/**
 * @swagger
 * /api/v1/employer/delete:
 *   delete:
 *     summary: Delete an employer
 *     description: Soft delete an employer by setting isDeleted to true.
 *     tags:
 *       - Employer/admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: employerId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the employer to delete.
 *     responses:
 *       200:
 *         description: Employer deleted successfully
 */
route.delete("/delete", verifyToken([admin_model]), deleteEmployer);

/**
 * @swagger
 * /api/v1/employer/update:
 *   put:
 *     summary: Update employer email and credits
 *     description: Update an employer's email and credits.
 *     tags:
 *       - Employer/admin
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - employerId
 *               - newEmail
 *             properties:
 *               employerId:
 *                 type: string
 *                 description: The ID of the employer to update.
 *               newEmail:
 *                 type: string
 *                 format: email
 *                 description: The new email for the employer.
 *               credits:
 *                 type: number
 *                 description: The number of credits to update.
 *     responses:
 *       200:
 *         description: Employer email and credits updated successfully
 */
route.put("/update", verifyToken([admin_model]), updateEmployerEmailAndCredits);

module.exports = route;
