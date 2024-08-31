const Joi = require("joi");

// Joi validation schema for signing a contract
const signContractValidationSchema = Joi.object({
  jobApplyId: Joi.string().required().label("Job Apply ID"),
  governmentIdFront: Joi.string().required().label("Government ID Front"),
  governmentIdBack: Joi.string().required().label("Government ID Back"),
  proofOfAddress: Joi.string().required().label("Proof of Address"),
  signature: Joi.string().required().label("Signature"),
});

module.exports = {
  signContractValidationSchema,
};
