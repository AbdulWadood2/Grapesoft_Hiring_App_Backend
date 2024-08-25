const Joi = require("joi");

// Define the Joi validation schema
const testPermissionsJoiSchema = Joi.object({
  multiChoiceQuestions: Joi.number().min(0).default(4),
  openQuestionWords: Joi.number().min(0).default(10),
  fileDataMax: Joi.number().min(0).default(100),
}).options({
  abortEarly: false,
});

module.exports = {
  testPermissionsJoiSchema,
};
