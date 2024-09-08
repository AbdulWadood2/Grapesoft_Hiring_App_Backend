const StripeKey = require("../models/stripeKey_model"); // Assuming this is the correct path
const catchAsync = require("../errorHandlers/catchAsync");
const AppError = require("../errorHandlers/appError");
const { successMessage } = require("../successHandlers/successController");

// method post
// endPoint /api/v1/stripe-key
// Create or update Stripe keys
exports.createOrUpdateStripeKey = catchAsync(async (req, res, next) => {
  const { publishableKey, secretKey, webHookSecret } = req.body;
  if (!publishableKey || !secretKey) {
    return next(
      new AppError("Please provide both publishable and secret keys", 400)
    );
  }

  // If keys already exist, update them; otherwise, create new ones
  let stripeKey = await StripeKey.findOne();

  if (stripeKey) {
    stripeKey.publishableKey = publishableKey;
    stripeKey.secretKey = secretKey;
    stripeKey.webHookSecret = webHookSecret;
    await stripeKey.save();
  } else {
    stripeKey = await StripeKey.create({
      publishableKey,
      secretKey,
      webHookSecret,
    });
  }

  return successMessage(200, res, "create or update strip", stripeKey);
});

// method post
// endPoint /api/v1/stripe-key
// Get the Stripe keys
exports.getStripeKey = catchAsync(async (req, res, next) => {
  const stripeKey = await StripeKey.findOne();

  if (!stripeKey) {
    return next(new AppError("Stripe keys not found", 400));
  }

  return successMessage(202, res, "Stripe key found", stripeKey);
});
