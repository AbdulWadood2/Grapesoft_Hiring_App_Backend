const express = require("express");
const {
  getTestPermissions,
  editTestPermissions,
} = require("../controllers/testPermissions_controller");
const route = express.Router();

// model
const admin_model = require("../models/admin_model");
const employer_model = require("../models/employer_model");
const candidate_model = require("../models/candidate_model");

const { verifyToken } = require("../authorization/verifyToken");

/**
 * @swagger
 * /api/v1/testPermissions:
 *   get:
 *     summary: get testPermissions
 *     description: Endpoint to get testPermissions
 *     tags:
 *       - All/testPermissions
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       202:
 *         description: Test created successfully
 */
route.get(
  "/",
  verifyToken([admin_model, employer_model, candidate_model]),
  getTestPermissions
);

/**
 * @swagger
 * /api/v1/testPermissions:
 *   put:
 *     summary: edit testPermissions
 *     description: Endpoint to edit testPermissions
 *     tags:
 *       - Admin/testPermissions
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               multiChoiceQuestions:
 *                 type: number
 *                 description: how many multiple choice allowed?.
 *                 example: 4
 *               openQuestionWords:
 *                 type: number
 *                 description: how amy word allowed in open questions.
 *                 example: 100
 *               fileDataMax:
 *                 type: number
 *                 description: how many data is allowed in file in (MB).
 *                 example: 10
 *     responses:
 *       202:
 *         description: Test created successfully
 */
route.put("/", verifyToken([admin_model]), editTestPermissions);

module.exports = route;
