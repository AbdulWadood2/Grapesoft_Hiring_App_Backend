const Joi = require("joi");

const objectId = Joi.string().regex(/^[0-9a-fA-F]{24}$/);

const validVideoExtensions = ["mp4", "mov", "avi"];
const validDocExtensions = ["pdf", "doc", "docx"];

const validateExtension = (value, helpers, validExtensions) => {
  const extension = value.split(".").pop().toLowerCase();
  if (!validExtensions.includes(extension)) {
    return helpers.error("any.invalid", { value, validExtensions });
  }
  return value;
};

const jobValidationSchema = Joi.object({
  title: Joi.string().required(),
  specification: Joi.object({
    title: Joi.string().required(),
    video: Joi.string()
      .required()
      .custom((value, helpers) =>
        validateExtension(value, helpers, validVideoExtensions)
      )
      .messages({
        "any.invalid": `Allowed file types: ${validVideoExtensions.join(
          ", "
        )}.`,
      }),
    docs: Joi.string()
      .required()
      .custom((value, helpers) =>
        validateExtension(value, helpers, validDocExtensions)
      )
      .messages({
        "any.invalid": `Allowed file types: ${validDocExtensions.join(", ")}.`,
      }),
  }).required(),
  training: Joi.object({
    title: Joi.string().required(),
    video: Joi.string()
      .required()
      .custom((value, helpers) =>
        validateExtension(value, helpers, validVideoExtensions)
      )
      .messages({
        "any.invalid": `Allowed file types: ${validVideoExtensions.join(
          ", "
        )}.`,
      }),
    docs: Joi.string()
      .required()
      .custom((value, helpers) =>
        validateExtension(value, helpers, validDocExtensions)
      )
      .messages({
        "any.invalid": `Allowed file types: ${validDocExtensions.join(", ")}.`,
      }),
  }).required(),
  contract: Joi.object({
    title: Joi.string().required(),
    video: Joi.string()
      .required()
      .custom((value, helpers) =>
        validateExtension(value, helpers, validVideoExtensions)
      )
      .messages({
        "any.invalid": `Allowed file types: ${validVideoExtensions.join(
          ", "
        )}.`,
      }),
  }).required(),
  status: Joi.boolean().default(true),
  privateOrPublic: Joi.boolean().default(true),
  testBuilderId: objectId.required(),
  coverLetter: Joi.boolean().default(true),
  cv: Joi.boolean().default(true),
  aboutVideo: Joi.boolean().default(true),
});

module.exports = {
  jobValidationSchema,
};
