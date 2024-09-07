// catchAsync
const catchAsync = require("../errorHandlers/catchAsync");
// appError
const appError = require("../errorHandlers/appError");
// successMessage
const { successMessage } = require("../successHandlers/successController");
const Stripe = require("stripe");
// model
const stripeKey_model = require("../models/stripeKey_model"); // Assuming you already have the model for Stripe keys
const subscription_model = require("../models/subscription_model");
const package_model = require("../models/package_model");

// Fetch Stripe keys from the database
const getStripeKeys = async () => {
  const keys = await stripeKey_model.findOne();
  if (!keys) {
    throw new Error("Stripe keys not found in the database.");
  }
  return keys;
};

// method post
// endpoint /api/v1/subscription/
// Add subscription with Stripe payment
const addSubscription = catchAsync(async (req, res, next) => {
  const { packageId } = req.body;

  // Fetch the selected package
  const selectedPackage = await package_model.findOne({ _id: packageId });
  if (!selectedPackage) {
    return next(new appError("Package not found", 400));
  }

  // Fetch Stripe keys from the database
  const stripeKeys = await getStripeKeys();
  const stripe = Stripe(stripeKeys.secretKey);
  // Create a Stripe checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: selectedPackage.title,
          },
          unit_amount: selectedPackage.pricePerCredit * 100, // Convert to cents
        },
        quantity: selectedPackage.numberOfCredits,
      },
    ],
    success_url: `${process.env.FRONTEND_BASE_URL}/subscriptionSuccess?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.FRONTEND_BASE_URL}/subscriptionCancel`,
    metadata: {
      employerId: req.user.id, // Pass employer ID as metadata to retrieve it later in the webhook
      packageId: selectedPackage._id.toString(), // Store package info
    },
  });

  return successMessage(202, res, "Subscription created successfully", {
    sessionId: session.id,
  });
});

// method POST
// endpoint /api/v1/subscription/success
// strip success webhook
const stripeSuccessWebhook = catchAsync(async (req, res, next) => {
  const stripeKeys = await getStripeKeys();
  const stripe = Stripe(stripeKeys.secretKey);
  console.log(typeof req.body);
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      req.headers["stripe-signature"],
      process.env.STRIPE_WEBHOOK_SECRET // Your Stripe Webhook Secret
    );
  } catch (error) {
    // console.log(error.message);
    return next(new appError(`Webhook error: ${error.message}`, 400));
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    // Retrieve metadata from session
    const employerId = session.metadata.employerId;
    const packageId = session.metadata.packageId;

    console.log(session.metadata);
    const package = await package_model.findOne({
      _id: packageId,
    });
    if (!package) {
      return next(new appError("package not found", 400));
    }
    // Fetch the subscription for the employer
    let subscription = await subscription_model.findOne({
      employerId: employerId,
    });
    // Step 1: Retrieve the Checkout Session
    const sessionCheckOutId = await stripe.checkout.sessions.retrieve(
      "cs_test_a1VEW789rbvA2kMgjYjr9sOxHoihJssaVy7NI3UqiXrSOjVgbIZle5ZfLZ"
    );
    // Step 2: Get the Payment Intent ID from the session
    const paymentIntentId = sessionCheckOutId.payment_intent;
    // Step 3: Retrieve the Payment Intent to get the transaction/charge details
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    // Step 4: Get the Charge ID (transaction ID) from the Payment Intent
    const chargeId = paymentIntent.latest_charge;
    if (!subscription) {
      // Create new subscription if it doesn't exist
      subscription = await subscription_model.create({
        employerId: employerId,
        currentPackage: {
          transactionId: chargeId, // Stripe session ID as transactionId
          title: package.title,
          features: package.features,
          pricePerCredit: package.pricePerCredit,
          numberOfCredits: package.numberOfCredits,
          type: package.type,
          active: package.active,
          packageStatus: {
            transactionId: session.id,
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
      // Update existing subscription
      subscription.subscriptionHistory.push(subscription.currentPackage);
      subscription.currentPackage = {
        transactionId: chargeId, // Stripe session ID as transactionId
        title: package.title,
        features: package.features,
        pricePerCredit: package.pricePerCredit,
        numberOfCredits: package.numberOfCredits,
        type: package.type,
        active: package.active,
        packageStatus: {
          transactionId: session.id,
          title: package.title,
          features: package.features,
          pricePerCredit: package.pricePerCredit,
          numberOfCredits: package.numberOfCredits,
          type: package.type,
          active: package.active,
        },
      };
      // Save the updated subscription
      await subscription.save();
    }
    console.log("congratulations done");
    return successMessage(
      200,
      res,
      "Subscription updated after payment",
      subscription
    );
  }
  return successMessage(200, res, null, {
    received: true,
  });
});

// method POST
// endpoint /api/v1/subscription/cancel
// Cancel subscription
const cancelSubscriptionWebhook = catchAsync(async (req, res, next) => {
  return successMessage(200, res, "Subscription cancelled successfully.", null);
});

// method POST
// endpoint /api/v1/subscription/verify-payment
// controllers/subscription_controller.js
const verifyPayment = catchAsync(async (req, res, next) => {
  const { sessionId } = req.body;
  const stripeKeys = await getStripeKeys();
  const stripe = Stripe(stripeKeys.secretKey);

  // Fetch the session from Stripe
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  if (!session) {
    return next(new appError("Session not found", 400));
  }

  // Verify session and update subscription
  // (The rest of the logic remains the same as in the webhook handler)

  return successMessage(200, res, "Payment verified successfully", session);
});

// const addSubscription = catchAsync(async (req, res, next) => {
//   const { packageId } = req.body;
//   const package = await package_model.findOne({
//     _id: packageId,
//   });
//   if (!package) {
//     return next(new appError("package not found", 400));
//   }
//   let subscription = await subscription_model.findOne({
//     employerId: req.user.id,
//   });
//   if (!subscription) {
//     subscription = await subscription_model.create({
//       employerId: req.user.id,
//       currentPackage: {
//         transactionId: null,
//         title: package.title,
//         features: package.features,
//         pricePerCredit: package.pricePerCredit,
//         numberOfCredits: package.numberOfCredits,
//         type: package.type,
//         active: package.active,
//         packageStatus: {
//           transactionId: null,
//           title: package.title,
//           features: package.features,
//           pricePerCredit: package.pricePerCredit,
//           numberOfCredits: package.numberOfCredits,
//           type: package.type,
//           active: package.active,
//         },
//       },
//     });
//   } else {
//     subscription.subscriptionHistory.push(subscription.currentPackage);
//     subscription.currentPackage = {
//       transactionId: null,
//       title: package.title,
//       features: package.features,
//       pricePerCredit: package.pricePerCredit,
//       numberOfCredits: package.numberOfCredits,
//       type: package.type,
//       active: package.active,
//       packageStatus: {
//         transactionId: null,
//         title: package.title,
//         features: package.features,
//         pricePerCredit: package.pricePerCredit,
//         numberOfCredits: package.numberOfCredits,
//         type: package.type,
//         active: package.active,
//       },
//     };
//     await subscription.save();
//   }
//   return successMessage(
//     202,
//     res,
//     "Subscription updated successfully",
//     subscription
//   );
// });

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
  stripeSuccessWebhook,
  cancelSubscriptionWebhook,
  verifyPayment,
  getEmployerSubscription,
};
