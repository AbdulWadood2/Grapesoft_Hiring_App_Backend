const express = require("express");
const {
  createPackage,
  editPackage,
  deletePackage,
  getAllPackages,
  editPackageStatus,
} = require("../controllers/package_controller");
const admin_model = require("../models/admin_model");
const employer_model = require("../models/employer_model");
const { verifyToken } = require("../authorization/verifyToken");
const route = express.Router();

/**
 * @swagger
 * /api/v1/package:
 *   post:
 *     summary: Create a new package
 *     tags:
 *       - Admin/Packages
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - features
 *               - pricePerCredit
 *               - numberOfCredits
 *             properties:
 *               title:
 *                 type: string
 *                 description: The title of the package
 *               features:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: A list of features included in the package
 *               pricePerCredit:
 *                 type: number
 *                 description: The price per credit for the package
 *               numberOfCredits:
 *                 type: number
 *                 description: The number of credits in the package
 *             example:
 *               title: "Premium Package"
 *               features: ["Feature 1", "Feature 2"]
 *               pricePerCredit: 10
 *               numberOfCredits: 100
 *     responses:
 *       202:
 *         description: Package created successfully
 */
route.post("/", verifyToken([admin_model]), createPackage);

/**
 * @swagger
 * /api/v1/package/{id}:
 *   put:
 *     summary: Edit an existing package
 *     tags:
 *       - Admin/Packages
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The package ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - features
 *               - pricePerCredit
 *               - numberOfCredits
 *             properties:
 *               title:
 *                 type: string
 *                 description: The title of the package
 *               features:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: A list of features included in the package
 *               pricePerCredit:
 *                 type: number
 *                 description: The price per credit for the package
 *               numberOfCredits:
 *                 type: number
 *                 description: The number of credits in the package
 *             example:
 *               title: "Premium Package"
 *               features: ["Feature 1", "Feature 2"]
 *               pricePerCredit: 10
 *               numberOfCredits: 100
 *     responses:
 *       200:
 *         description: Package updated successfully
 */
route.put("/:id", verifyToken([admin_model]), editPackage);

/**
 * @swagger
 * /api/v1/package/{id}:
 *   delete:
 *     summary: Delete a package
 *     tags:
 *       - Admin/Packages
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The package ID
 *     responses:
 *       202:
 *         description: Package deleted successfully
 */
route.delete("/:id", verifyToken([admin_model]), deletePackage);

/**
 * @swagger
 * /api/v1/package:
 *   get:
 *     summary: Get all packages
 *     tags:
 *       - Admin/Packages
 *       - Employer/Packages
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Packages retrieved successfully
 */
route.get("/", verifyToken([admin_model, employer_model]), getAllPackages);

/**
 * @swagger
 * /api/v1/package/freeStatus/edit:
 *   put:
 *     summary: edit package status
 *     tags:
 *       - Admin/Packages
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Packages status edited
 */
route.put("/freeStatus/edit", verifyToken([admin_model]), editPackageStatus);

module.exports = route;
