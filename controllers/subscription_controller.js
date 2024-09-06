// catchAsync
const catchAsync = require("../errorHandlers/catchAsync");
// appError
const appError = require("../errorHandlers/appError");
// successMessage
const { successMessage } = require("../successHandlers/successController");
// model
const subscription_model = require("../models/subscription_model");
const package_model = require("../models/package_model");

// method post
// endpoint /api/v1/subscription/
// description add subscription
const addSubscription = catchAsync(async (req, res, next) => {
  const { packageId } = req.body;
  const package = await package_model.findOne({
    _id: packageId,
  });
  if (!package) {
    return next(new appError("package not found", 400));
  }
  let subscription = await subscription_model.findOne({
    employerId: req.user.id,
  });
  if (!subscription) {
    subscription = await subscription_model.create({
      employerId: req.user.id,
      currentPackage: {
        transactionId: null,
        title: package.title,
        features: package.features,
        pricePerCredit: package.pricePerCredit,
        numberOfCredits: package.numberOfCredits,
        type: package.type,
        active: package.active,
        packageStatus: {
          transactionId: null,
          title: package.title,
          features: package.features,
          pricePerCredit: package.pricePerCredit,
          numberOfCredits: package.numberOfCredits,
          type: package.type,
          active: package.active,
        },
      },
    });
  } else {
    subscription.subscriptionHistory.push(subscription.currentPackage);
    subscription.currentPackage = {
      transactionId: null,
      title: package.title,
      features: package.features,
      pricePerCredit: package.pricePerCredit,
      numberOfCredits: package.numberOfCredits,
      type: package.type,
      active: package.active,
      packageStatus: {
        transactionId: null,
        title: package.title,
        features: package.features,
        pricePerCredit: package.pricePerCredit,
        numberOfCredits: package.numberOfCredits,
        type: package.type,
        active: package.active,
      },
    };
    await subscription.save();
  }
  return successMessage(
    202,
    res,
    "Subscription updated successfully",
    subscription
  );
});

// method get
// endpoint /api/v1/subscription/admin
// description get specific employer subscription by admin
const getEmployerSubscription = catchAsync(async (req, res, next) => {
  const employerId = req.query.employerId;

  // Validate employerId query parameter
  if (!employerId) {
    return next(new appError("Employer ID is required", 400));
  }

  // Find subscription by employer ID
  const subscription = await subscription_model.findOne({ employerId });
  // If no subscription found, return error
  if (!subscription) {
    return next(new appError("Subscription not found for this employer", 400));
  }

  // Return success message with subscription details
  return successMessage(
    200,
    res,
    "Subscription fetched successfully",
    subscription
  );
});

module.exports = {
  addSubscription,
  getEmployerSubscription,
};
