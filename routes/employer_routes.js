const express = require("express");
const { signUpEmployer, logInEmployer, downloadFile, addJob} = require("../controllers/employer_controller");
const multer = require('multer');
const route = express.Router();
const upload = multer({ dest: 'api/v1/employer/' });

/**
 * @swagger
 * /api/v1/employer/signup:
 *   post:
 *     summary: Signup a new employer
 *     description: Creates a new employer account and returns the access and refresh tokens.
 *     tags:
 *       - Employer/account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - first_name
 *               - last_name
 *               - email
 *               - password
 *               - company_name
 *             properties:
 *               first_name:
 *                 type: string
 *                 description: The first name of the employer.
 *               last_name:
 *                 type: string
 *                 description: The last name of the employer.
 *               email:
 *                 type: string
 *                 format: email
 *                 description: The email address of the employer.
 *               password:
 *                 type: string
 *                 format: password
 *                 description: The password for the employer's account.
 *               company_name:
 *                 type: string
 *                 description: The company name of the employer.
 *     responses:
 *       201:
 *         description: Signup success
 */
route.post("/signup", signUpEmployer);




/**
 * @swagger
 * /api/v1/employer/login:
 *   post:
 *     summary: Login a new employer
 *     description: Creates a new employer account and returns the access and refresh tokens.
 *     tags:
 *       - Employer/account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: The email address of the employer.
 *               password:
 *                 type: string
 *                 format: password
 *                 description: The password for the employer's account.
 *     responses:
 *       201:
 *         description: Signup success
 */
route.post("/login", logInEmployer);






/**
 * @swagger
 * /api/v1/employer/downloadFile:
 *   get:
 *     summary: Download a file
 *     description: Downloads a file from the server.
 *     tags:
 *       - Employer/account
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: File downloaded successfully
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 */
route.get("/downloadFile", downloadFile);








/**
 * @swagger
 * /api/v1/employer/addJob:
 *   post:
 *     summary: Add a new job
 *     description: Adds a new job with the specified details.
 *     tags:
 *       - Employer/account
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 default: null
 *               specification[description]:
 *                 type: string
 *                 required: true
 *               specification[video]:
 *                 type: string
 *                 required: true
 *               specification[pdf]:
 *                 type: string
 *                 required: true
 *               training[description]:
 *                 type: string
 *                 required: true
 *               training[video]:
 *                 type: string
 *                 required: true
 *               training[pdf]:
 *                 type: string
 *                 required: true
 *               contract[description]:
 *                 type: string
 *                 required: true
 *               contract[file]:
 *                 type: string
 *                 required: true
 *               testTime:
 *                 type: string
 *                 required: true
 *               file:
 *                 type: string
 *                 format: binary
 *               coverLetter:
 *                 type: boolean
 *               cv:
 *                 type: boolean
 *               aboutVideo:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Job added successfully
 */
route.post("/addJob", upload.single('file'), addJob);







module.exports = route;