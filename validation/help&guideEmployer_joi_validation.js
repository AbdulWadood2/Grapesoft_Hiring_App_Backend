const Joi = require("joi");

// Define the Joi validation schema
const helpGuideEmployerValidationSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().required(),
  video: Joi.string().allow(null).optional(),
  sort: Joi.number().allow(null),
}).options({
  abortEarly: false,
});

module.exports = {
  helpGuideEmployerValidationSchema,
};
