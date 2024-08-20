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
    userId: req.user.id,
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

module.exports = {
  addSubscription,
};
