const express = require("express");
const {
  createHelpGuideEmployer,
  getAllHelpGuideEmployers,
  editHelpGuideEmployer,
  deleteHelpGuideEmployer,
  editHelpGuideEmployerSort,
} = require("../controllers/help&guideEmployer_controller");
// models
const employer_model = require("../models/employer_model");
const admin_model = require("../models/admin_model");
// verify
const { verifyToken } = require("../authorization/verifyToken");
const route = express.Router();

/**
 * @swagger
 * /api/v1/helpguideemployer/:
 *   post:
 *     summary: Create employer help and guide
 *     description: Create a new employer help and guide entry.
 *     tags:
 *       - Admin/HelpGuideEmployer
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               video:
 *                 type: string
 *                 nullable: true
 *             required:
 *               - title
 *               - description
 *     responses:
 *       202:
 *         description: Help and guide created successfully.
 */
route.post("/", verifyToken([admin_model]), createHelpGuideEmployer);

/**
 * @swagger
 * /api/v1/helpguideemployer/:
 *   get:
 *     summary: Get all employer help and guide
 *     description: Retrieve all employer help and guide entries, sorted by their sort value.
 *     tags:
 *       - Employer/HelpGuideEmployer
 *       - Admin/HelpGuideEmployer
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved all help and guide questionnaires.
 */
route.get(
  "/",
  verifyToken([employer_model, admin_model]),
  getAllHelpGuideEmployers
);

/**
 * @swagger
 * /api/v1/helpguideemployer/{id}:
 *   put:
 *     summary: Edit employer help and guide
 *     description: Edit an existing employer help and guide entry.
 *     tags:
 *       - Admin/HelpGuideEmployer
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the help and guide to edit
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               video:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Help and guide updated successfully.
 */
route.put("/:id", verifyToken([admin_model]), editHelpGuideEmployer);

/**
 * @swagger
 * /api/v1/helpguideemployer/{id}:
 *   delete:
 *     summary: Delete employer help and guide
 *     description: Delete an existing employer help and guide entry.
 *     tags:
 *       - Admin/HelpGuideEmployer
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the help and guide to delete
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Help and guide deleted successfully.
 */
route.delete("/:id", verifyToken([admin_model]), deleteHelpGuideEmployer);

/**
 * @swagger
 * /api/v1/helpguideemployer/sort/{id}:
 *   put:
 *     summary: Edit employer help and guide sort order
 *     description: Update the sort order of an existing employer help and guide entry.
 *     tags:
 *       - Admin/HelpGuideEmployer
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the help and guide to edit sort order
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sort:
 *                 type: number
 *     responses:
 *       200:
 *         description: Sort order updated successfully.
 */
route.put("/sort/:id", verifyToken([admin_model]), editHelpGuideEmployerSort);

module.exports = route;
