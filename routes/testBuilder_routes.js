const express = require("express");
const {
  createTestBuilder,
  getAllTestBuilders,
  getTestBuilderById,
  updateTestBuilder,
  deleteTestBuilder,
  addQuestion,
  editQuestion,
  deleteQuestion,
} = require("../controllers/testBuilder_controller");
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

/**
 * @swagger
 * /api/v1/testBuilder:
 *   get:
 *     summary: Get all test builders with pagination
 *     description: Fetch a list of test builders created by the authenticated employer with pagination support.
 *     tags:
 *       - Employer/TestBuilder
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           example: 1
 *         description: The page number to fetch.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           example: 10
 *         description: The number of test builders to fetch per page.
 *     responses:
 *       200:
 *         description: A list of test builders and pagination information.
 */
route.get("/", verifyToken([employer_model]), getAllTestBuilders);

/**
 * @swagger
 * /api/v1/testBuilder/{id}:
 *   get:
 *     summary: Get a single test builder by ID
 *     description: Retrieve a specific test builder created by the authenticated employer using its ID.
 *     tags:
 *       - Employer/TestBuilder
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the test builder to retrieve.
 *     responses:
 *       200:
 *         description: A single test builder object.
 */
route.get("/:id", verifyToken([employer_model]), getTestBuilderById);

/**
 * @swagger
 * /api/v1/testBuilder/{id}:
 *   put:
 *     summary: Update a test builder by ID
 *     description: Update a specific test builder created by the authenticated employer using its ID.
 *     tags:
 *       - Employer/TestBuilder
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the test builder to update.
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
 *     responses:
 *       200:
 *         description: Test Builder updated successfully.
 */
route.put("/:id", verifyToken([employer_model]), updateTestBuilder);

/**
 * @swagger
 * /api/v1/testBuilder/{id}:
 *   delete:
 *     summary: Delete a test builder by ID
 *     description: Delete a specific test builder created by the authenticated employer using its ID. This also removes associated test questions and unlinks the test builder from any jobs.
 *     tags:
 *       - Employer/TestBuilder
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the test builder to delete.
 *     responses:
 *       202:
 *         description: Test Builder deleted successfully. No content returned.
 */
route.delete("/:id", verifyToken([employer_model]), deleteTestBuilder);

/**
 * @swagger
 * /api/v1/testBuilder/question/{id}:
 *   post:
 *     summary: Add a new question to a test builder
 *     tags:
 *       - Employer/TestBuilder
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the test Builder to add.
 *         schema:
 *           type: string
 *     requestBody:
 *       description: Payload for adding questions to the test builder
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
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
 *             required:
 *               - questions
 *     responses:
 *       202:
 *         description: Questions created successfully
 */
route.post("/question/:id", verifyToken([employer_model]), addQuestion);

/**
 * @swagger
 * /api/v1/testBuilder/question/{id}:
 *   put:
 *     summary: Edit an existing question
 *     description: This endpoint allows you to edit an existing question in the test builder.
 *     tags:
 *       - Employer/TestBuilder
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the question to edit.
 *         schema:
 *           type: string
 *     requestBody:
 *       description: Payload for editing a question in the test builder
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: integer
 *                 description: Type of the question (0 for multiple choice, 1 for true/false, 2 for descriptive).
 *                 example: 0
 *               questionText:
 *                 type: string
 *                 description: The text of the question.
 *               options:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: The possible options for the question.
 *               correctAnswer:
 *                 type: integer
 *                 description: Index of the correct answer for multiple choice questions.
 *                 example: 1
 *               allowFile:
 *                 type: boolean
 *                 description: Allow file upload for the question.
 *                 example: false
 *     responses:
 *       202:
 *         description: Successfully edited the question.
 */
route.put("/question/:id", verifyToken([employer_model]), editQuestion);

/**
 * @swagger
 * /api/v1/testBuilder/question/{id}:
 *   delete:
 *     summary: Delete a question
 *     description: This endpoint allows you to delete an existing question from the test builder.
 *     tags:
 *       - Employer/TestBuilder
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the question to delete.
 *         schema:
 *           type: string
 *     responses:
 *       202:
 *         description: Successfully deleted the question.
 */
route.delete("/question/:id", verifyToken([employer_model]), deleteQuestion);

module.exports = route;
