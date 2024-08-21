const express = require("express");
const { uploadProductImg } = require("../controllers/awsController");
const route = express.Router();

// model
const employer_model = require("../models/employer_model");
const admin_model = require("../models/admin_model");
const candidate_model = require("../models/candidate_model");

const { verifyToken } = require("../authorization/verifyToken");

const multer = require("multer");

const multerStorageUser = multer.memoryStorage();
const uploadsUser = multer({
  storage: multerStorageUser,
});

const uploadFieldsUser = uploadsUser.fields([{ name: "file", maxCount: 100 }]);

/**
 * @swagger
 * /api/v1/s3/:
 *   post:
 *     summary: Upload file
 *     description: Uploads multiple photos to the S3 bucket.
 *     tags:
 *       - S3/file
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: The files to upload.
 *     responses:
 *       200:
 *         description: Photos uploaded successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
route.post(
  "/",
  verifyToken([admin_model, employer_model, candidate_model]),
  uploadFieldsUser,
  uploadProductImg
);

module.exports = route;
