const express = require("express");
const multer = require("multer");
const { uploadProductImg } = require("../controllers/awsController");
const TestPermissions = require("../models/testPermissions_model");
const mime = require("mime-types"); // Import the mime-types package
const route = express.Router();

// Helper function to determine file type based on the buffer
const getFileExtension = (buffer) => {
  // Convert buffer to base64 string for easier processing
  const base64String = buffer.toString("base64");

  // Detect if file is a video or image based on base64 data
  if (base64String.startsWith("/9j/")) {
    return "jpeg";
  } else if (base64String.startsWith("GkXf")) {
    return "mp4";
  }

  return null; // Unknown file type or no extension needed
};

// Function to create dynamic multer upload middleware based on file size from DB
const dynamicMulterUpload = async (req, res, next) => {
  try {
    // Fetch the maximum file size from the database model
    const testPermissions = await TestPermissions.findOne();
    if (!testPermissions) {
      return res
        .status(500)
        .json({ message: "Failed to fetch file size limit from database." });
    }

    // Convert the max file size from MB to bytes
    const maxSizeInBytes = testPermissions.fileDataMax * 1024 * 1024;

    // Set up Multer with dynamic file size limit
    const multerStorageUser = multer.memoryStorage();
    const uploadsUser = multer({
      storage: multerStorageUser,
      limits: { fileSize: maxSizeInBytes },
    });

    const uploadFieldsUser = uploadsUser.fields([
      { name: "file", maxCount: 100 },
    ]);

    // Use Multer middleware for file upload
    uploadFieldsUser(req, res, async (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({
            message: `File size too large. Max limit is ${testPermissions.fileDataMax} MB.`,
          });
        }
        return res.status(400).json({ message: err.message });
      } else if (err) {
        return res
          .status(500)
          .json({ message: "An error occurred during file upload." });
      }

      // Detect file type for files without extensions
      if (req.files && req.files.file) {
        for (const file of req.files.file) {
          // Check if the file has no extension
          if (!file.originalname.includes(".")) {
            const fileExtension = getFileExtension(file.buffer);
            if (fileExtension) {
              // Rename the file with the detected extension
              file.originalname += `.${fileExtension}`;
            }
          }
        }
      }

      // Proceed to the next middleware if no error
      next();
    });
  } catch (error) {
    console.error("Error fetching file size limit from database:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

/**
 * @swagger
 * /api/v1/s3/:
 *   post:
 *     summary: Upload file
 *     description: Uploads multiple photos to the S3 bucket.
 *     tags:
 *       - S3/file
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
route.post("/", dynamicMulterUpload, uploadProductImg);

module.exports = route;
