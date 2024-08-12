const express = require("express");
const {
  createJob,
  getJobs,
  getJobById,
  editJob,
  deleteJob,
} = require("../controllers/job_controller");
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
 *                   docs:
 *                     type: string
 *                     format: uri
 *                     example: "https://example.com/contract_pdf.pdf"
 *                     description: "URI for the contract pdf."
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

/**
 * @swagger
 * /api/v1/job:
 *   get:
 *     summary: Get jobs with pagination
 *     description: Fetch a list of jobs created by the logged-in employer with pagination. The jobs are returned in descending order based on creation date.
 *     tags:
 *       - Employer/Jobs
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: The page number to fetch.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: The number of jobs to fetch per page.
 *     responses:
 *       200:
 *         description: Jobs fetched successfully.
 */
route.get("/", verifyToken([employer_model]), getJobs);

/**
 * @swagger
 * /api/v1/job/{id}:
 *   get:
 *     summary: Get a job by ID
 *     description: Fetch a specific job by its ID for the logged-in employer. The job's specification, training, and contract media files will include signed URLs.
 *     tags:
 *       - Employer/Jobs
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the job to fetch.
 *     responses:
 *       202:
 *         description: Job fetched successfully.
 */
route.get("/:id", verifyToken([employer_model]), getJobById);

/**
 * @swagger
 * /api/v1/job/{id}:
 *   put:
 *     summary: Edit a job by ID
 *     description: Update the details of a specific job by its ID for the logged-in employer. The updated job will include signed URLs for the specification, training, and contract media files.
 *     tags:
 *       - Employer/Jobs
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the job to edit.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: The title of the job
 *                 example: Senior Software Engineer
 *               specification:
 *                 type: object
 *                 properties:
 *                   title:
 *                     type: string
 *                     example: "Training Material"
 *                     description: "Title of the training material."
 *                   video:
 *                     type: string
 *                     description: Filename of the specification video
 *                     example: specification-video.mp4
 *                   docs:
 *                     type: string
 *                     description: Filename of the specification document
 *                     example: specification-docs.pdf
 *               training:
 *                 type: object
 *                 properties:
 *                   title:
 *                     type: string
 *                     example: "Training Material"
 *                     description: "Title of the training material."
 *                   video:
 *                     type: string
 *                     description: Filename of the training video
 *                     example: training-video.mp4
 *                   docs:
 *                     type: string
 *                     description: Filename of the training document
 *                     example: training-docs.pdf
 *               contract:
 *                 type: object
 *                 properties:
 *                   title:
 *                     type: string
 *                     example: "Training Material"
 *                     description: "Title of the training material."
 *                   docs:
 *                     type: string
 *                     example: "https://example.com/contract_pdf.pdf"
 *                     description: "URI for the contract pdf."
 *               testBuilderId:
 *                  type: string
 *                  example: "60d9f8f5d5f9c6001c8e4f2a"
 *                  description: "ID of the associated test builder."
 *               coverLetter:
 *                  type: boolean
 *                  default: true
 *                  description: "Indicates if a cover letter is required."
 *               cv:
 *                  type: boolean
 *                  default: true
 *                  description: "Indicates if a CV is required."
 *               aboutVideo:
 *                  type: boolean
 *                  default: true
 *                  description: "Indicates if an 'about' video is required."
 *               status:
 *                  type: boolean
 *                  default: true
 *                  description: "Indicates if status."
 *               privateOrPublic:
 *                  type: boolean
 *                  default: true
 *                  description: "Indicates if privateOrPublic."
 *     responses:
 *       202:
 *         description: Job updated successfully.
 */
route.put("/:id", verifyToken([employer_model]), editJob);

/**
 * @swagger
 * /api/v1/job/{id}:
 *   delete:
 *     summary: Delete a job by ID
 *     description: Delete a specific job by its ID for the logged-in employer. If the job is not found, an error will be returned.
 *     tags:
 *       - Employer/Jobs
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the job to delete.
 *     responses:
 *       202:
 *         description: Job deleted successfully.
 */
route.delete("/:id", verifyToken([employer_model]), deleteJob);

module.exports = route;
