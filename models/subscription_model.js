const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema(
  {
    employerId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      unique: true,
    },
    currentPackage: {
      transactionId: {
        type: String,
        default: null,
      },
      title: {
        type: String,
        required: true,
      },
      features: [
        {
          type: String,
          required: true,
        },
      ],
      pricePerCredit: {
        type: Number,
        default: null,
      },
      numberOfCredits: {
        type: Number,
        required: true,
      },
      type: {
        type: Number,
        default: 1, // 0 free trial , 1 paid
      },
      active: {
        type: Boolean,
        default: true,
      },
      packageStatus: {
        title: {
          type: String,
          required: true,
        },
        features: [
          {
            type: String,
            required: true,
          },
        ],
        pricePerCredit: {
          type: Number,
          default: null,
        },
        numberOfCredits: {
          type: Number,
          required: true,
        },
        numberOfCreditsAdminCustomAdded: {
          type: Number,
          default: 0,
        },
        numberOfCreditsAdminCustomRemove: {
          type: Number,
          default: 0,
        },
        type: {
          type: Number,
          default: 1, // 0 free trial , 1 paid
        },
        active: {
          type: Boolean,
          default: true,
        },
      },
    },
    subscriptionHistory: [
      {
        transactionId: {
          type: String,
          default: null,
        },
        title: {
          type: String,
          required: true,
        },
        features: [
          {
            type: String,
            required: true,
          },
        ],
        pricePerCredit: {
          type: Number,
          default: null,
        },
        numberOfCredits: {
          type: Number,
          required: true,
        },
        type: {
          type: Number,
          default: 1, // 0 free trial , 1 paid
        },
        active: {
          type: Boolean,
          default: true,
        },
        packageStatus: {
          transactionId: {
            type: String,
            default: null,
          },
          title: {
            type: String,
            required: true,
          },
          features: [
            {
              type: String,
              required: true,
            },
          ],
          pricePerCredit: {
            type: Number,
            default: null,
          },
          numberOfCredits: {
            type: Number,
            required: true,
          },
          numberOfCreditsAdminCustomAdded: {
            type: Number,
            default: 0,
          },
          numberOfCreditsAdminCustomRemove: {
            type: Number,
            default: 0,
          },
          type: {
            type: Number,
            default: 1, // 0 free trial , 1 paid
          },
          active: {
            type: Boolean,
            default: true,
          },
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const candidate = mongoose.model("subscriptions", subscriptionSchema);
module.exports = candidate;
