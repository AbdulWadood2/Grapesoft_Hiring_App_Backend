const express = require("express");
const {
  createOrUpdateStripeKey,
  getStripeKey,
} = require("../controllers/stripeKey_controller");
const { verifyToken } = require("../authorization/verifyToken"); // Assuming this is the correct middleware
const router = express.Router();
const admin_model = require("../models/admin_model");

/**
 * @swagger
 * /api/v1/stripe-key:
 *   post:
 *     summary: Create or update Stripe keys
 *     tags:
 *       - Admin/StripeKey
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               publishableKey:
 *                 type: string
 *                 example: pk_test_12345
 *               secretKey:
 *                 type: string
 *                 example: sk_test_12345
 *     responses:
 *       200:
 *         description: Stripe keys created/updated successfully
 */
router.post(
  "/",
  verifyToken([admin_model]), // Only admins can access this route
  createOrUpdateStripeKey
);

/**
 * @swagger
 * /api/v1/stripe-key:
 *   get:
 *     summary: Get the current Stripe keys
 *     tags:
 *       - Admin/StripeKey
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Stripe keys retrieved successfully
 */
router.get(
  "/",
  verifyToken([admin_model]), // Only admins can access this route
  getStripeKey
);

module.exports = router;
