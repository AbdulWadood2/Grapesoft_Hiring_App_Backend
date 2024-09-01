// catchAsync
const catchAsync = require("../errorHandlers/catchAsync");
// appError
const appError = require("../errorHandlers/appError");
// model
const notification_model = require("../models/notification_model.js");
// const
// successMessage
const { successMessage } = require("../successHandlers/successController");

// method get
// endPoint /api/v1/notification
// description Get notifications
const getNotifications = catchAsync(async (req, res, next) => {
  const [unreadNotifications, allNotifications] = await Promise.all([
    notification_model.countDocuments({
      receiverId: req.user.id,
      isRead: false,
    }),
    notification_model
      .find({
        receiverId: req.user.id,
      })
      .sort({
        createdAt: -1,
      }),
  ]);
  return successMessage(202, res, "fetched notifications", {
    unreadNotifications,
    allNotifications,
  });
});

// method put
// endPoint /api/v1/notification/mark-as-read
// description Mark as read
const markAsRead = catchAsync(async (req, res, next) => {
  // Update all notifications for the user to mark them as read
  await notification_model.updateMany(
    { receiverId: req.user.id },
    { $set: { isRead: true } }
  );

  return successMessage(200, res, "All notifications marked as read");
});

module.exports = {
  getNotifications,
  markAsRead,
};
