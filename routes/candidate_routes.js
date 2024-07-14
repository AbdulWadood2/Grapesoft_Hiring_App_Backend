const express = require("express");
const { signUpCandidate } = require("../controllers/candidate_controller");

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

module.exports = route;
