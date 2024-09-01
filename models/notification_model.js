const mongoose = require("mongoose");

// Define the schema for the verification documents
const notification = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // Add timestamps for createdAt and updatedAt
  }
);

// Export the model
const notificationSchema = mongoose.model("notification", notification);

module.exports = notificationSchema;
