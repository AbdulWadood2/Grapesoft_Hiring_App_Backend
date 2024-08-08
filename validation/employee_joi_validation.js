const Joi = require("joi");

const employerValidationSchema = Joi.object({
  first_name: Joi.string().min(1).required(),
  last_name: Joi.string().min(1).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  company_name: Joi.string().required(),
}).options({
  abortEarly: true,
});

const employerLogInValidationSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
}).options({
  abortEarly: true,
});

const editEmployerProfileSchema = Joi.object({
  avatar: Joi.string().allow(null),
  first_name: Joi.string().min(1).max(255),
  last_name: Joi.string().min(1).max(255),
  company_name: Joi.string().min(1).max(255),
  NewApplication: Joi.boolean(),
  TestTaken: Joi.boolean(),
  ContractSigned: Joi.boolean(),
}).options({
  abortEarly: true,
});

module.exports = {
  employerValidationSchema,
  employerLogInValidationSchema,
  editEmployerProfileSchema,
};
