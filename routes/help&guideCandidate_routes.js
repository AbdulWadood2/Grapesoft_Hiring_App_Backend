const express = require("express");
const {
  createHelpGuidecandidate,
  getAllHelpGuidecandidates,
  editHelpGuidecandidate,
  deleteHelpGuidecandidate,
  editHelpGuidecandidateSort,
} = require("../controllers/help&guideCandidate_controller");
// models
const candidate_model = require("../models/candidate_model");
const admin_model = require("../models/admin_model");
// verify
const { verifyToken } = require("../authorization/verifyToken");
const route = express.Router();

/**
 * @swagger
 * /api/v1/helpguidecandidate/:
 *   post:
 *     summary: Create candidate help and guide
 *     description: Create a new candidate help and guide entry.
 *     tags:
 *       - Admin/HelpGuidecandidate
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
route.post("/", verifyToken([admin_model]), createHelpGuidecandidate);

/**
 * @swagger
 * /api/v1/helpguidecandidate/:
 *   get:
 *     summary: Get all candidate help and guide
 *     description: Retrieve all candidate help and guide entries, sorted by their sort value.
 *     tags:
 *       - candidate/HelpGuidecandidate
 *       - Admin/HelpGuidecandidate
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved all help and guide questionnaires.
 */
route.get(
  "/",
  verifyToken([candidate_model, admin_model]),
  getAllHelpGuidecandidates
);

/**
 * @swagger
 * /api/v1/helpguidecandidate/{id}:
 *   put:
 *     summary: Edit candidate help and guide
 *     description: Edit an existing candidate help and guide entry.
 *     tags:
 *       - Admin/HelpGuidecandidate
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
route.put("/:id", verifyToken([admin_model]), editHelpGuidecandidate);

/**
 * @swagger
 * /api/v1/helpguidecandidate/{id}:
 *   delete:
 *     summary: Delete candidate help and guide
 *     description: Delete an existing candidate help and guide entry.
 *     tags:
 *       - Admin/HelpGuidecandidate
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
route.delete("/:id", verifyToken([admin_model]), deleteHelpGuidecandidate);

/**
 * @swagger
 * /api/v1/helpguidecandidate/sort/{id}:
 *   put:
 *     summary: Edit candidate help and guide sort order
 *     description: Update the sort order of an existing candidate help and guide entry.
 *     tags:
 *       - Admin/HelpGuidecandidate
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
route.put("/sort/:id", verifyToken([admin_model]), editHelpGuidecandidateSort);

module.exports = route;
