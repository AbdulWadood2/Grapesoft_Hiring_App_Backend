const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const AppError = require("../errorHandlers/appError");
const fs = require('fs');
const s3 = new S3Client({
  region: 'eu-north-1', // Ensure this is the correct region
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const uploadProductImg = async (req, res, next) => {
  try {
    const files = req.files["photo"];
    console.log(req.files);

    if (!files || files.length === 0) {
      return next(new AppError("No files provided", 400));
    }

    // Create an array to store promises for each S3 upload
    const uploadPromises = files.map((file) => {
      const fileName = `${file.fieldname}_${Date.now()}_${file.originalname}`;
      const params = {
        Bucket: 'junkmates', // Ensure this is the correct bucket name
        Key: fileName,
        Body: fs.readFileSync(file.path),
        ContentType: file.mimetype,
    };

      return s3.send(new PutObjectCommand(params)).then(() => {
        // Construct the URL for the uploaded object
        return `https://junkmates.s3.eu-north-1.amazonaws.com/${fileName}`;
      });
    });

    // Wait for all S3 uploads to complete
    const urls = await Promise.all(uploadPromises);

    res.status(200).json({
      status: "success",
      photo:urls, // Return the array of URLs
    });
  } catch (error) {
    return next(new AppError(error.message, 500));
  }
};

module.exports = {uploadProductImg}; // Export your function
