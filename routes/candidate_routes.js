const express = require("express");
const {
  signUpCandidate,
  logInCandidate,
  getCandidateProfile,
  sendForgetOTP,
  verifyOTP,
  resetPassword,
  updateProfile,
  completeProfileWithPassword,
} = require("../controllers/candidate_controller");
const candidate = require("../models/candidate_model");
const authenticationController = require("../controllers/authentication_controller");
const { verifyToken } = require("../authorization/verifyToken");
const route = express.Router();

/**
 * @swagger
 * /api/v1/candidate/signup:
 *   post:
 *     summary: Signup a new candidate
 *     description: Creates a new candidate account and returns the access and refresh tokens.
 *     tags:
 *       - Candidate/account
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
 *     responses:
 *       201:
 *         description: Signup success
 */
route.post("/signup", signUpCandidate);

/**
 * @swagger
 * /api/v1/candidate/login:
 *   post:
 *     summary: Login a new employer
 *     description: Creates a new employer account and returns the access and refresh tokens.
 *     tags:
 *       - Candidate/account
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
route.post("/login", logInCandidate);

/**
 * @swagger
 * /api/v1/candidate:
 *   get:
 *     summary: Get candidate profile
 *     description: Get candidate profile
 *     tags:
 *       - Candidate/account
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved employer profile
 */
route.get("/", verifyToken([candidate]), getCandidateProfile);

/**
 * @swagger
 * /api/v1/candidate/sendForgetOTP:
 *   post:
 *     summary: Send a forget password OTP to candidate
 *     tags:
 *       - Candidate/account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 description: The employer's email address
 *                 example: employer@example.com
 *     responses:
 *       200:
 *         description: OTP sent successfully
 */
route.post("/sendForgetOTP", sendForgetOTP);

/**
 * @swagger
 * /api/v1/candidate/verifyOTP:
 *   post:
 *     summary: Verify OTP
 *     description: Verify the OTP sent to the candidate's email.
 *     tags:
 *       - Candidate/account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - otp
 *               - email
 *             properties:
 *               otp:
 *                 type: number
 *                 example: 123456"
 *                 description: The OTP sent to the candidate's email
 *               email:
 *                 type: string
 *                 example: "example@example.com"
 *                 description: The candidate's email address
 *     responses:
 *       200:
 *         description: OTP verified
 */
route.post("/verifyOTP", verifyOTP);

/**
 * @swagger
 * /api/v1/candidate/resetPassword:
 *   post:
 *     summary: Reset the password
 *     description: Allows an candiadte to reset their password using email and OTP.
 *     tags:
 *       - Candidate/account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *               - email
 *               - otp
 *             properties:
 *               email:
 *                 type: string
 *                 description: The employer's email.
 *                 example: employer@example.com
 *               otp:
 *                 type: string
 *                 description: The OTP sent to the employer's email.
 *                 example: 123456
 *               password:
 *                 type: string
 *                 description: The new password to be set.
 *                 example: NewStrongPassword123!
 *     responses:
 *       200:
 *         description: Password reset successfully.
 */
route.post("/resetPassword", resetPassword);

/**
 * @swagger
 * /api/v1/candidate/:
 *   put:
 *     summary: Update the candidate profile
 *     description: Updates the candidate profile with the provided information.
 *     tags:
 *       - Candidate/account
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: uri
 *                 description: URL to the avatar image.
 *                 nullable: true
 *               first_name:
 *                 type: string
 *                 description: The first name of the candidate.
 *                 example: John
 *                 required: true
 *               last_name:
 *                 type: string
 *                 description: The last name of the candidate.
 *                 example: Doe
 *                 required: true
 *               countryOfRecidence:
 *                 type: string
 *                 description: The country where the candidate currently resides.
 *                 example: United Kingdom
 *                 enum: [null, "United Kingdom", "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia", "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo (Congo-Brazzaville)", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czech Republic (Czechia)", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini (fmr. Swaziland)", "Ethiopia", "Fiji", "Finland", "France", "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana", "Haiti", "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Italy", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar (formerly Burma)", "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia", "Norway", "Oman", "Pakistan", "Palau", "Palestine State", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria", "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United States of America", "Uruguay", "Uzbekistan", "Vanuatu", "Vatican City", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe", "Other"]
 *                 nullable: true
 *               countryOfBirth:
 *                 type: string
 *                 description: The country where the candidate was born.
 *                 example: United Kingdom
 *                 enum: [null, "United Kingdom", "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia", "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo (Congo-Brazzaville)", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czech Republic (Czechia)", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini (fmr. Swaziland)", "Ethiopia", "Fiji", "Finland", "France", "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana", "Haiti", "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Italy", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar (formerly Burma)", "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia", "Norway", "Oman", "Pakistan", "Palau", "Palestine State", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria", "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United States of America", "Uruguay", "Uzbekistan", "Vanuatu", "Vatican City", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe", "Other"]
 *                 nullable: true
 *               timezone:
 *                 type: string
 *                 description: The candidate's timezone.
 *                 example: GMT
 *                 enum: [null, "GMT", "CET", "EST", "PST", "IST", "AEST", "CST", "MST", "HST", "AKST", "Other"]
 *                 nullable: true
 *               contactNumber:
 *                 type: string
 *                 description: The candidate's contact number.
 *                 example: "+441234567890"
 *                 nullable: true
 *               whatsapp:
 *                 type: string
 *                 description: The candidate's WhatsApp number.
 *                 example: "+441234567890"
 *                 nullable: true
 *               telegram:
 *                 type: string
 *                 description: The candidate's Telegram handle.
 *                 example: "@johndoe"
 *                 nullable: true
 *               skype:
 *                 type: string
 *                 description: The candidate's Skype username.
 *                 example: "live:johndoe"
 *                 nullable: true
 *               other:
 *                 type: string
 *                 description: Any other contact information.
 *                 example: "Other contact details"
 *                 nullable: true
 *               aboutVideo:
 *                 type: string
 *                 format: uri
 *                 description: URL to the candidate's about video.
 *                 nullable: true
 *               cv:
 *                 type: string
 *                 format: uri
 *                 description: URL to the candidate's CV.
 *                 nullable: true
 *               coverLetter:
 *                 type: string
 *                 format: uri
 *                 description: URL to the candidate's cover letter.
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
route.put("/", verifyToken([candidate]), updateProfile);

/**
 * @swagger
 * /api/v1/candidate/password:
 *   post:
 *     summary: Complete candidate profile with password
 *     description: Allows a candidate to complete their profile by setting a password. This should only be done if the password hasn't been set yet.
 *     tags:
 *       - Candidate/account
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
 *                 description: The candidate's email address.
 *                 example: candidate@example.com
 *               password:
 *                 type: string
 *                 description: The password to set for the candidate.
 *                 example: P@ssw0rd123
 *     responses:
 *       200:
 *         description: Profile updated successfully.
 */
route.post("/password", completeProfileWithPassword);

module.exports = route;
