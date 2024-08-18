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

module.exports = route;
