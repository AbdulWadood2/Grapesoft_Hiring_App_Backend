const express = require("express");
const {
  getJobApplications,
  getSingleJobApplication,
  updateJobApplicationNote,
  acceptJobApplication,
  passJobApplication,
  contractApproved,
  rejectedApplication,
  deleteApplication,
  redirectToTest,
} = require("../controllers/jobApplications_controller");
// models
const employer_model = require("../models/employer_model");
const candidate_model = require("../models/candidate_model");

const { verifyToken } = require("../authorization/verifyToken");

const route = express.Router();

/**
 * @swagger
 * /api/v1/jobApplication:
 *   get:
 *     summary: Get all job applications for the employer
 *     tags:
 *       - Employer/JobApplications
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number for pagination (default is 1)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items per page (default is 10)
 *     responses:
 *       200:
 *         description: Successfully fetched job applications with pagination.
 */
route.get("/", verifyToken([employer_model]), getJobApplications);

/**
 * @swagger
 * /api/v1/jobApplication/singleProduct:
 *   get:
 *     summary: Get a single job application by jobId
 *     tags:
 *       - Employer/JobApplications
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: jobApplicationId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the job.
 *     responses:
 *       200:
 *         description: Successfully fetched the job application.
 */
route.get(
  "/singleProduct",
  verifyToken([employer_model]),
  getSingleJobApplication
);

/**
 * @swagger
 * /api/v1/jobApplication/editNote:
 *   put:
 *     summary: Update a job application note by jobId and candidateId
 *     tags:
 *       - Employer/JobApplications
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: jobId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the job.
 *       - in: query
 *         name: candidateId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the candidate.
 *     requestBody:
 *       description: Note to update in the job application.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               note:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successfully updated the job application note.
 */
route.put("/editNote", verifyToken([employer_model]), updateJobApplicationNote);

/**
 * @swagger
 * /api/v1/jobApplication/acceptApplication:
 *   put:
 *     summary: Accept a job application
 *     tags:
 *       - Employer/JobApplications
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: jobId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the job.
 *       - in: query
 *         name: candidateId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the candidate.
 *     responses:
 *       202:
 *         description: Job application accepted.
 */
route.put(
  "/acceptApplication",
  verifyToken([employer_model]),
  acceptJobApplication
);

/**
 * @swagger
 * /api/v1/jobApplication/passApplication:
 *   put:
 *     summary: Pass a job application
 *     tags:
 *       - Employer/JobApplications
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: jobId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the job.
 *       - in: query
 *         name: candidateId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the candidate.
 *     responses:
 *       202:
 *         description: Job application passed.
 */
route.put("/", verifyToken([employer_model]), passJobApplication);

/**
 * @swagger
 * /api/v1/jobApplication/ContractApproved:
 *   put:
 *     summary: Approve a contract for a job application
 *     tags:
 *       - Employer/JobApplications
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: jobId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the job.
 *       - in: query
 *         name: candidateId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the candidate.
 *     responses:
 *       202:
 *         description: Job contract approved.
 */
route.put("/ContractApproved", verifyToken([employer_model]), contractApproved);

/**
 * @swagger
 * /api/v1/jobApplication/rejectedApplication:
 *   put:
 *     summary: Reject a job application
 *     tags:
 *       - Employer/JobApplications
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: jobId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the job.
 *       - in: query
 *         name: candidateId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the candidate.
 *     responses:
 *       202:
 *         description: Job application rejected.
 */
route.put(
  "/rejectedApplication",
  verifyToken([employer_model]),
  rejectedApplication
);

/**
 * @swagger
 * /api/v1/jobApplication/deleteApplication:
 *   delete:
 *     summary: Delete a job application
 *     tags:
 *       - Employer/JobApplications
 *       - Candidate/JobApplications
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: jobId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the job.
 *       - in: query
 *         name: candidateId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the candidate.
 *     responses:
 *       202:
 *         description: Job application deleted.
 */
route.delete(
  "/deleteApplication",
  verifyToken([employer_model, candidate_model]),
  deleteApplication
);

route.get("/redirectToTest", redirectToTest);

module.exports = route;
