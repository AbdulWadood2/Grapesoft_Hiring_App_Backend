const express = require("express");
const route = express.Router();

// model
const admin_model = require("../models/admin_model");
// auth
const { verifyToken } = require("../authorization/verifyToken");
// controller
const {
  loginAdmin,
  getAdminProfile,
  getAdminStatistics,
  resetAdminPassword,
  verifyAdminOTP,
  sendForgetOTP,
} = require("../controllers/admin_controller");

/**
 * @swagger
 * /api/v1/admin/login:
 *   post:
 *     summary: Admin login
 *     description: Logs in an admin using their email and password, and returns a JWT access token.
 *     tags:
 *       - Admin/account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: The admin's email address.
 *                 example: admin@example.com
 *               password:
 *                 type: string
 *                 description: The admin's password.
 *                 example: password123
 *     responses:
 *       202:
 *         description: Login successful. Returns an access token and admin details.
 */
route.post("/login", loginAdmin);

/**
 * @swagger
 * /api/v1/admin/:
 *   get:
 *     summary: Get Admin Profile
 *     description: Retrieve the profile of the logged-in admin user.
 *     tags:
 *       - Admin/account
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved admin profile.
 */
route.get("/", verifyToken([admin_model]), getAdminProfile);

/**
 * @swagger
 * /api/v1/admin/statistics:
 *   get:
 *     summary: Get statistics for admin dashboard
 *     description: Retrieve statistics including total credits purchased, total subscription cost, number of employers, candidates, active jobs, and total job quantities.
 *     tags:
 *       - Admin/statistics
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       202:
 *         description: Successfully retrieved admin statistics
 */
route.get("/statistics", verifyToken([admin_model]), getAdminStatistics);


/**
 * @swagger
 * /api/v1/admin/sendForgetOTP:
 *   post:
 *     summary: Send a forget password OTP to admin
 *     tags:
 *       - Admin/account
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
 *                 description: The admin's email address
 *                 example: admin@example.com
 *     responses:
 *       200:
 *         description: OTP sent successfully
 */
route.post("/sendForgetOTP", sendForgetOTP);

/**
 * @swagger
 * /api/v1/admin/verifyOTP:
 *   post:
 *     summary: Verify OTP for admin
 *     description: Verify the OTP sent to the admin's email.
 *     tags:
 *       - Admin/account
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
 *                 example: 123456
 *                 description: The OTP sent to the admin's email
 *               email:
 *                 type: string
 *                 example: "example@example.com"
 *                 description: The admin's email address
 *     responses:
 *       200:
 *         description: OTP verified
 */
route.post("/verifyOTP", verifyAdminOTP);

/**
 * @swagger
 * /api/v1/admin/resetPassword:
 *   post:
 *     summary: Reset the admin password
 *     description: Allows an admin to reset their password using email and OTP.
 *     tags:
 *       - Admin/account
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
 *                 description: The admin's email.
 *                 example: admin@example.com
 *               otp:
 *                 type: string
 *                 description: The OTP sent to the admin's email.
 *                 example: 123456
 *               password:
 *                 type: string
 *                 description: The new password to be set.
 *                 example: NewStrongPassword123!
 *     responses:
 *       200:
 *         description: Password reset successfully.
 */
route.post("/resetPassword", resetAdminPassword);

module.exports = route;
