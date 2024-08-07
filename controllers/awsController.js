const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const AppError = require("../errorHandlers/appError");
const fs = require("fs");
const s3 = new S3Client({
  region: process.env.AWS_REGION, // Ensure this is the correct region
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const uploadProductImg = async (req, res, next) => {
  try {
    const files = req.files["photo"];

    if (!files || files.length === 0) {
      return next(new AppError("No files provided", 400));
    }

    // Create an array to store promises for each S3 upload
    const uploadPromises = files.map((file) => {
      const fileName = `${file.fieldname}_${Date.now()}_${file.originalname}`;
      const params = {
        Bucket: process.env.AWS_BUCKET_NAME, // Ensure this is the correct bucket name
        Key: fileName,
        Body: fs.readFileSync(file.path),
        ContentType: file.mimetype,
      };

      return s3.send(new PutObjectCommand(params)).then(() => {
        // Construct the URL for the uploaded object
        return `${fileName}`;
      });
    });

    // Wait for all S3 uploads to complete
    const urls = await Promise.all(uploadPromises);

    res.status(200).json({
      status: "success",
      photo: urls, // Return the array of URLs
    });
  } catch (error) {
    return next(new AppError(error.message, 500));
  }
};

/**
 * Generate a pre-signed URL for accessing an object in the specified S3 bucket.
 * @param {string} objectKey - The key of the object in the S3 bucket.
 * @returns {Promise<string>} - A promise that resolves to the pre-signed URL.
 */
async function generateSignedUrl(objectKeys) {
  try {
    if (objectKeys.length === 0) return [];
    const signedUrls = await Promise.all(
      objectKeys.map(async (objectKey) => {
        if (!objectKey) return null;
        // const params = {
        //   Bucket: process.env.AWS_BUCKET_NAME, // Replace with your S3 bucket name
        //   Key: objectKey,
        // };

        // // Generate pre-signed URL
        // const command = new GetObjectCommand(params);
        // return await getSignedUrl(s3, command);
        return `https://${process.env.AWS_BUCKET_NAME}.s3.amazonaws.com/${objectKey}`;
      })
    );
    return signedUrls;
  } catch (error) {
    throw error;
  }
}

module.exports = { generateSignedUrl, uploadProductImg }; // Export your function
