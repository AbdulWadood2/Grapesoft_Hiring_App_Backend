const Joi = require("joi");

// create package and edit
const packageValidationSchema = Joi.object({
  title: Joi.string().required().messages({
    "string.base": "Title should be a type of text",
    "string.empty": "Title cannot be an empty field",
    "any.required": "Title is a required field",
  }),

  features: Joi.array()
    .items(
      Joi.string().required().messages({
        "string.base": "Each feature should be a type of text",
        "string.empty": "Feature cannot be an empty field",
        "any.required": "Feature is a required field",
      })
    )
    .required()
    .messages({
      "array.base": "Features should be an array",
      "any.required": "Features are required",
    }),

  pricePerCredit: Joi.number().default(null).allow(null),

  numberOfCredits: Joi.number().required().messages({
    "number.base": "Number of credits should be a type of number",
    "any.required": "Number of credits is a required field",
  }),
  active: Joi.boolean(),
}).options({
  abortEarly: false,
});

module.exports = {
  packageValidationSchema,
};
