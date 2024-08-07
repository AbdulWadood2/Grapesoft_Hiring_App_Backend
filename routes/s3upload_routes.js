const express = require("express");
const { uploadProductImg } = require("../controllers/awsController");
const route = express.Router();
const multer = require("multer");

const multerStorageUser = multer.diskStorage({
  destination: "public/img/users/", // Destination to store video
  filename: (req, file, next) => {
    if (file.fieldname === "photo") {
      next(null, "photo" + ".jpg");
    } else if (file.fieldname === "cover") {
      next(null, file.fieldname + "_" + Date.now() + ".jpg");
    } else if (file.fieldname === "video") {
      next(null, file.fieldname + "_" + Date.now() + ".mp4");
    } else if (file.fieldname === "audio") {
      next(null, file.fieldname + "_" + Date.now() + ".mp3");
    }
  },
});
const uploadsUser = multer({
  storage: multerStorageUser,
});

const uploadFieldsUser = uploadsUser.fields([{ name: "photo", maxCount: 100 }]);

/**
 * @swagger
 * /api/v1/s3/:
 *   post:
 *     summary: Upload photos
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
 *               photo:
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
route.post("/", uploadFieldsUser, uploadProductImg);

module.exports = route;
