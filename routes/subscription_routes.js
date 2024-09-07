const express = require("express");
const {
  addSubscription,
  getEmployerSubscription,
  stripeSuccessWebhook,
  cancelSubscriptionWebhook,
  verifyPayment,
  getmySubscription,
} = require("../controllers/subscription_controller");
const route = express.Router();

// body parser
const bodyParser = require("body-parser");

// model
const employer_model = require("../models/employer_model");
const admin_model = require("../models/admin_model");

const { verifyToken } = require("../authorization/verifyToken");

/**
 * @swagger
 * /api/v1/subscription/:
 *   post:
 *     summary: Add or update a subscription
 *     description: Add a new subscription for the authenticated user or update the current subscription with a new package.
 *     tags:
 *       - Employer/Subscriptions
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               packageId:
 *                 type: string
 *                 description: The ID of the package to subscribe to.
 *                 example: 60d9f9f9f9f9f9f9f9f9f9f9
 *     responses:
 *       202:
 *         description: Subscription updated successfully.
 */
route.post("/", verifyToken([employer_model]), addSubscription);

route.post(
  "/success",
  bodyParser.raw({ type: "application/json" }), // Use raw body parser to prevent JSON parsing
  stripeSuccessWebhook
);

route.post("/cancel", cancelSubscriptionWebhook);

// Verify Payment Route
route.post("/verify-payment", verifyPayment);

/**
 * @swagger
 * /api/v1/subscription/admin:
 *   get:
 *     summary: Get a specific employer's subscription details by admin
 *     description: Retrieve subscription details for a specific employer using employer ID.
 *     tags:
 *       - Subscription
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: employerId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the employer whose subscription details are to be fetched.
 *     responses:
 *       200:
 *         description: Subscription fetched successfully
 */
route.get("/admin", verifyToken([admin_model]), getEmployerSubscription);
/**
 * @swagger
 * /api/v1/subscription/employer:
 *   get:
 *     summary: employer
 *     description: employer
 *     tags:
 *       - Subscription
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Subscription fetched successfully
 */
route.get("/employer", verifyToken([employer_model]), getmySubscription);

module.exports = route;
