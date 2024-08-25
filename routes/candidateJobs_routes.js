const express = require("express");
const {
  applyJobCandidate,
  getCandidateJobApplications,
} = require("../controllers/candidateJobs_controller");
const route = express.Router();

// model
const candidate_model = require("../models/candidate_model");

const { verifyToken } = require("../authorization/verifyToken");

/**
 * @swagger
 * /api/v1/candidateJob/apply:
 *   post:
 *     summary: Apply for a job as a candidate
 *     description: This endpoint allows a candidate to apply for a job by submitting their details, including their CV, cover letter, and about video. If the candidate does not exist, they will be created in the system.
 *     tags:
 *       - Candidate/Job Applications
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - jobId
 *               - first_name
 *               - last_name
 *               - email
 *             properties:
 *               jobId:
 *                 type: string
 *                 description: The ID of the job being applied for.
 *               first_name:
 *                 type: string
 *                 description: The first name of the candidate.
 *               last_name:
 *                 type: string
 *                 description: The last name of the candidate.
 *               email:
 *                 type: string
 *                 description: The email address of the candidate.
 *               countryOfRecidence:
 *                 type: string
 *                 description: The country of residence of the candidate.
 *               countryOfBirth:
 *                 type: string
 *                 description: The country of birth of the candidate.
 *               timezone:
 *                 type: string
 *                 description: The candidate's timezone.
 *               availabilityDate:
 *                 type: string
 *                 description: The date the candidate is available to start work.
 *               contactNumber:
 *                 type: string
 *                 description: The contact number of the candidate.
 *               aboutVideo:
 *                 type: string
 *                 description: The filename of the candidate's about video, if provided.
 *               cv:
 *                 type: string
 *                 description: The filename of the candidate's CV, if provided.
 *               coverLetter:
 *                 type: string
 *                 description: The candidate's cover letter text, if provided.
 *     responses:
 *       202:
 *         description: Job application submitted successfully.
 */
route.post("/apply", applyJobCandidate);

/**
 * @swagger
 * /api/v1/candidateJob/applications/:
 *   get:
 *     summary: Get all job applications for a candidate with pagination.
 *     description: Fetches all job applications associated with a candidate, supporting pagination to manage large sets of data.
 *     tags:
 *       - Candidate/Job Applications
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *           default: 1
 *         description: The page number to fetch.
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           default: 10
 *         description: The number of job applications to fetch per page.
 *     responses:
 *       200:
 *         description: Job applications fetched successfully with pagination info.
 */
route.get(
  "/applications/",
  verifyToken([candidate_model]),
  getCandidateJobApplications
);

module.exports = route;
