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
// job create edit
const jobValidationSchema = Joi.object({
  title: Joi.string().required(),
  specification: Joi.object({
    title: Joi.string().required(),
    video: Joi.string()
      .custom((value, helpers) =>
        validateExtension(value, helpers, validVideoExtensions)
      )
      .optional()
      .allow(null), // This makes the field optional

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
    title: Joi.string().optional().allow(null), // Optional title
    docs: Joi.string()
      .custom((value, helpers) =>
        validateExtension(value, helpers, validDocExtensions)
      )
      .optional()
      .allow(null) // Optional docs field
      .messages({
        "any.invalid": `Allowed file types: ${validDocExtensions.join(", ")}.`,
      }),
  }).optional(), // The entire contract object is optional

  status: Joi.boolean().default(true),
  privateOrPublic: Joi.boolean().default(true),
  testBuilderId: objectId.required(),
  coverLetter: Joi.boolean().default(true),
  cv: Joi.boolean().default(true),
  aboutVideo: Joi.boolean().default(true),
}).options({
  abortEarly: false,
});
// job draft
const jobDraftValidationSchema = Joi.object({
  title: Joi.string().allow(null, ""),
  specification: Joi.object({
    title: Joi.string().allow(null, ""),
    video: Joi.string()
      .allow(null, "")

      .custom((value, helpers) =>
        validateExtension(value, helpers, validVideoExtensions)
      )
      .messages({
        "any.invalid": `Allowed file types: ${validVideoExtensions.join(
          ", "
        )}.`,
      }),
    docs: Joi.string()
      .allow(null, "")

      .custom((value, helpers) =>
        validateExtension(value, helpers, validDocExtensions)
      )
      .messages({
        "any.invalid": `Allowed file types: ${validDocExtensions.join(", ")}.`,
      }),
  }),
  training: Joi.object({
    title: Joi.string().allow(null, ""),
    video: Joi.string()
      .allow(null, "")

      .custom((value, helpers) =>
        validateExtension(value, helpers, validVideoExtensions)
      )
      .messages({
        "any.invalid": `Allowed file types: ${validVideoExtensions.join(
          ", "
        )}.`,
      }),
    docs: Joi.string()
      .allow(null, "")

      .custom((value, helpers) =>
        validateExtension(value, helpers, validDocExtensions)
      )
      .messages({
        "any.invalid": `Allowed file types: ${validDocExtensions.join(", ")}.`,
      }),
  }),
  contract: Joi.object({
    title: Joi.string().allow(null, ""),
    docs: Joi.string()
      .allow(null, "")

      .custom((value, helpers) =>
        validateExtension(value, helpers, validDocExtensions)
      )
      .messages({
        "any.invalid": `Allowed file types: ${validDocExtensions.join(", ")}.`,
      }),
  }),
  testBuilderId: objectId.allow(null),
  coverLetter: Joi.boolean().allow(null, ""),
  cv: Joi.boolean().allow(null, ""),
  aboutVideo: Joi.boolean().allow(null, ""),
}).options({
  abortEarly: false,
});

module.exports = {
  jobValidationSchema,
  jobDraftValidationSchema,
};
