const express = require("express");
const { createTestBuilder } = require("../controllers/testBuilder_controller");
const route = express.Router();

// model
const employer_model = require("../models/employer_model");

const { verifyToken } = require("../authorization/verifyToken");

/**
 * @swagger
 * /api/v1/testBuilder:
 *   post:
 *     summary: Create a test builder
 *     description: Endpoint to create a new test builder along with its associated questions.
 *     tags:
 *       - Employer/TestBuilder
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               testName:
 *                 type: string
 *                 description: Name of the test.
 *                 example: "JavaScript Basics"
 *               testTime:
 *                 type: number
 *                 description: Duration of the test in minutes.
 *                 example: 60
 *               questions:
 *                 type: array
 *                 description: List of questions for the test.
 *                 items:
 *                   type: object
 *                   properties:
 *                     type:
 *                       type: integer
 *                       description: Type of the question (0 for multiple choice, 1 for true/false, 2 for descriptive).
 *                       example: 0
 *                     questionText:
 *                       type: string
 *                       description: Text of the question.
 *                       example: "What is JavaScript?"
 *                     options:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: Options for multiple choice questions.
 *                       example: ["Option 1", "Option 2", "Option 3", "Option 4"]
 *                     correctAnswer:
 *                       type: integer
 *                       description: Index of the correct answer for multiple choice questions.
 *                       example: 1
 *                     allowFile:
 *                       type: boolean
 *                       description: Allow file upload for the question.
 *                       example: false
 *     responses:
 *       202:
 *         description: Test created successfully
 */
route.post("/", verifyToken([employer_model]), createTestBuilder);

module.exports = route;
