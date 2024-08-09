const express = require("express");
const { createJob } = require("../controllers/job_controller");
const employer_model = require("../models/employer_model");
const { verifyToken } = require("../authorization/verifyToken");
const route = express.Router();

/**
 * @swagger
 * /api/v1/job:
 *   post:
 *     summary: Create a new job
 *     tags:
 *       - Employer/Jobs
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
 *                 example: "Frontend Developer"
 *                 description: "Title of the job position."
 *               specification:
 *                 type: object
 *                 required:
 *                   - title
 *                   - video
 *                   - docs
 *                 properties:
 *                   title:
 *                     type: string
 *                     example: "Job Specification"
 *                     description: "Title of the job specification."
 *                   video:
 *                     type: string
 *                     format: uri
 *                     example: "https://example.com/specification_video.mp4"
 *                     description: "URI for the specification video."
 *                   docs:
 *                     type: string
 *                     format: uri
 *                     example: "https://example.com/specification_docs.pdf"
 *                     description: "URI for the specification documents."
 *               training:
 *                 type: object
 *                 required:
 *                   - title
 *                   - video
 *                   - docs
 *                 properties:
 *                   title:
 *                     type: string
 *                     example: "Training Material"
 *                     description: "Title of the training material."
 *                   video:
 *                     type: string
 *                     format: uri
 *                     example: "https://example.com/training_video.mp4"
 *                     description: "URI for the training video."
 *                   docs:
 *                     type: string
 *                     format: uri
 *                     example: "https://example.com/training_docs.pdf"
 *                     description: "URI for the training documents."
 *               contract:
 *                 type: object
 *                 required:
 *                   - title
 *                   - video
 *                 properties:
 *                   title:
 *                     type: string
 *                     example: "Contract Material"
 *                     description: "Title of the contract material."
 *                   video:
 *                     type: string
 *                     format: uri
 *                     example: "https://example.com/contract_video.mp4"
 *                     description: "URI for the contract video."
 *               testBuilderId:
 *                 type: string
 *                 example: "60d9f8f5d5f9c6001c8e4f2a"
 *                 description: "ID of the associated test builder."
 *               coverLetter:
 *                 type: boolean
 *                 default: true
 *                 description: "Indicates if a cover letter is required."
 *               cv:
 *                 type: boolean
 *                 default: true
 *                 description: "Indicates if a CV is required."
 *               aboutVideo:
 *                 type: boolean
 *                 default: true
 *                 description: "Indicates if an 'about' video is required."
 *     responses:
 *       202:
 *         description: Job created successfully
 */
route.post("/", verifyToken([employer_model]), createJob);

module.exports = route;
