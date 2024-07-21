const express = require("express");
const { signUpCandidate, logInCandidate, getJobs } = require("../controllers/candidate_controller");
const candidate = require("../models/candidate_model");
const authenticationController = require('../controllers/authentication_controller');
const route = express.Router();

/**
 * @swagger
 * /api/v1/candidate/signup:
 *   post:
 *     summary: Signup a new candidate
 *     description: Creates a new candidate account and returns the access and refresh tokens.
 *     tags:
 *       - Candidate/account
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
 *     responses:
 *       201:
 *         description: Signup success
 */
route.post("/signup", signUpCandidate);




/**
 * @swagger
 * /api/v1/candidate/login:
 *   post:
 *     summary: Login a new employer
 *     description: Creates a new employer account and returns the access and refresh tokens.
 *     tags:
 *       - Candidate/account
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
route.post("/login", logInCandidate);


/**
 * @swagger
 * /api/v1/candidate/getJobs:
 *   get:
 *     summary: Retrieve job listings
 *     description: Retrieves a list of job openings available to candidates.
 *     tags:
 *       - Candidate/account
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of job openings
 */
route.get("/getJobs", authenticationController.protect(candidate), getJobs);


module.exports = route;
