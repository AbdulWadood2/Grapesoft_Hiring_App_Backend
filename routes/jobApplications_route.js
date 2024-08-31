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
  signContract,
  getDataForSignContract,
  getSignContract,
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
  verifyToken([employer_model, candidate_model]),
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
 *       - in: query
 *         name: jobApplicationId
 *         schema:
 *           type: string
 *         required: true
 *         description: jobApplicationId.
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
 *       - in: query
 *         name: jobApplicationId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the jobApplicationId.
 *     responses:
 *       202:
 *         description: Job application passed.
 */
route.put(
  "/passApplication",
  verifyToken([employer_model]),
  passJobApplication
);

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
 *       - in: query
 *         name: jobApplicationId
 *         schema:
 *           type: string
 *         required: true
 *         description: jobApplicationId.
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
 *       - in: query
 *         name: jobApplicationId
 *         schema:
 *           type: string
 *         required: true
 *         description: jobApplicationId.
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

/**
 * @swagger
 * /api/v1/jobApplication/signContract:
 *   post:
 *     summary: Sign a contract for a job application
 *     description: Allows a candidate to sign a contract for a specific job application after verifying the necessary documents.
 *     tags:
 *       - Candidate/JobApplications
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               jobApplyId:
 *                 type: string
 *                 description: The ID of the job application.
 *                 example: 64e7bfbf57f9f0f7d882e1bc
 *               governmentIdFront:
 *                 type: string
 *                 description: URL or reference to the front image of the government ID.
 *                 example: https://bucket-name.s3.amazonaws.com/path/to/governmentIdFront.jpg
 *               governmentIdBack:
 *                 type: string
 *                 description: URL or reference to the back image of the government ID.
 *                 example: https://bucket-name.s3.amazonaws.com/path/to/governmentIdBack.jpg
 *               proofOfAddress:
 *                 type: string
 *                 description: URL or reference to the proof of address image.
 *                 example: https://bucket-name.s3.amazonaws.com/path/to/proofOfAddress.jpg
 *               signature:
 *                 type: string
 *                 description: URL or reference to the signature image.
 *                 example: https://bucket-name.s3.amazonaws.com/path/to/signature.jpg
 *     responses:
 *       201:
 *         description: Contract signed successfully
 */
route.post("/signContract", verifyToken([candidate_model]), signContract);

/**
 * @swagger
 * /api/v1/jobApplication/signContractRequirements:
 *   get:
 *     summary: Retrieve data required for signing a contract
 *     description: Fetches the necessary data for a job application contract signing process, including job application details, submitted test, and contract information.
 *     tags:
 *       - Candidate/JobApplications
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: jobApplyId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the job application for which to retrieve data.
 *     responses:
 *       202:
 *         description: Contract required data fetched successfully
 */
route.get(
  "/signContractRequirements",
  verifyToken([candidate_model]),
  getDataForSignContract
);

/**
 * @swagger
 * /api/v1/jobApplication/signContract:
 *   get:
 *     summary: Get sign contract details for a job application
 *     description: Retrieve the contract details for a job application if the application is in the correct status.
 *     tags:
 *       - Employer/JobApplications
 *       - Candidate/JobApplications
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: jobApplyId
 *         required: true
 *         description: The ID of the job application
 *         schema:
 *           type: string
 *     responses:
 *       202:
 *         description: Contract data fetched successfully
 */
route.get(
  "/signContract",
  verifyToken([employer_model, candidate_model]),
  getSignContract
);

module.exports = route;
