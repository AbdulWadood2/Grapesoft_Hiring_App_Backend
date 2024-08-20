const express = require("express");
const { addSubscription } = require("../controllers/subscription_controller");
const route = express.Router();

// model
const employer_model = require("../models/employer_model");

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

module.exports = route;
