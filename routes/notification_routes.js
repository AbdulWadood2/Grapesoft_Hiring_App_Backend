const express = require("express");
const {
  getNotifications,
  markAsRead,
} = require("../controllers/notification_controller");
const { verifyToken } = require("../authorization/verifyToken");

const employer_model = require("../models/employer_model");
const candidate_model = require("../models/candidate_model");

const router = express.Router();

/**
 * @swagger
 * /api/v1/notification:
 *   get:
 *     summary: Get all notifications for the authenticated user
 *     tags:
 *       - Employer/Notifications
 *       - Candidate/Notifications
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       202:
 *         description: Successfully fetched notifications.
 */
router.get(
  "/",
  verifyToken([employer_model, candidate_model]),
  getNotifications
);

/**
 * @swagger
 * /api/v1/notification/mark-as-read:
 *   put:
 *     summary: Mark all notifications as read for the authenticated user
 *     tags:
 *       - Employer/Notifications
 *       - Candidate/Notifications
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read.
 */
router.put(
  "/mark-as-read",
  verifyToken([employer_model, candidate_model]),
  markAsRead
);

module.exports = router;
