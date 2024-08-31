const mongoose = require("mongoose");

// Define the schema for the verification documents
const signContract = new mongoose.Schema(
  {
    jobApplyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "jobapply",
      default: null,
    },
    governmentIdFront: {
      type: String,
      required: true, // image
    },
    governmentIdBack: {
      type: String,
      required: true, // image
    },
    proofOfAddress: {
      type: String,
      required: true, // image
    },
    signature: {
      type: String,
      required: true, // image
    },
    agreedToTerms: {
      type: Boolean,
      default: null,
    },
  },
  {
    timestamps: true, // Add timestamps for createdAt and updatedAt
  }
);

// Export the model
const signContractSchema = mongoose.model("contractsign", signContract);

module.exports = signContractSchema;
