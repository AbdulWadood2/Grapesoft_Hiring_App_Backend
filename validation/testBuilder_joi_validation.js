const Joi = require("joi");

const testBuilder_create_validation = Joi.object({
  testName: Joi.string().required(),
  testTime: Joi.number().required(),
  questions: Joi.array()
    .items(
      Joi.object({
        type: Joi.number().integer().valid(0, 1, 2).required(),
        questionText: Joi.string().required(),
        options: Joi.alternatives()
          .try(
            Joi.when("type", {
              is: 1,
              then: Joi.array().min(2).items(Joi.string()).required(),
              otherwise: Joi.valid(null),
            })
          )
          .allow(null),
        correctAnswer: Joi.alternatives()
          .try(
            Joi.when("type", {
              is: 1,
              then: Joi.number().integer().required(),
              otherwise: Joi.valid(null),
            })
          )
          .allow(null),
        allowFile: Joi.alternatives()
          .try(
            Joi.when("type", {
              is: 0,
              then: Joi.boolean().required(),
              otherwise: Joi.valid(null),
            })
          )
          .allow(null),
      })
    )
    .min(1)
    .required(),
}).options({
  abortEarly: false,
});

const testBuilder_update_validation = Joi.object({
  testName: Joi.string().required(),
  testTime: Joi.number().required(),
}).options({
  abortEarly: false,
});

const testBuilder_addQuestion_validation = Joi.object({
  questions: Joi.array()
    .items(
      Joi.object({
        type: Joi.number().integer().valid(0, 1, 2).required(),
        questionText: Joi.string().required(),
        options: Joi.alternatives()
          .try(
            Joi.when("type", {
              is: 1,
              then: Joi.array().min(2).items(Joi.string()).required(),
              otherwise: Joi.valid(null),
            })
          )
          .allow(null),
        correctAnswer: Joi.alternatives()
          .try(
            Joi.when("type", {
              is: 1,
              then: Joi.number().integer().required(),
              otherwise: Joi.valid(null),
            })
          )
          .allow(null),
        allowFile: Joi.alternatives()
          .try(
            Joi.when("type", {
              is: 0,
              then: Joi.boolean().required(),
              otherwise: Joi.valid(null),
            })
          )
          .allow(null),
      })
    )
    .min(1)
    .required(),
}).options({
  abortEarly: false,
});
const testBuilder_editQuestion_validation = Joi.object({
  type: Joi.number().integer().valid(0, 1, 2).required(),
  questionText: Joi.string().required(),
  options: Joi.alternatives()
    .try(
      Joi.when("type", {
        is: 1,
        then: Joi.array().min(2).items(Joi.string()).required(),
        otherwise: Joi.valid(null),
      })
    )
    .allow(null),
  correctAnswer: Joi.alternatives()
    .try(
      Joi.when("type", {
        is: 1,
        then: Joi.number().integer().required(),
        otherwise: Joi.valid(null),
      })
    )
    .allow(null),
  allowFile: Joi.alternatives()
    .try(
      Joi.when("type", {
        is: 0,
        then: Joi.boolean().required(),
        otherwise: Joi.valid(null),
      })
    )
    .allow(null),
}).options({
  abortEarly: false,
});

module.exports = {
  testBuilder_create_validation,
  testBuilder_update_validation,
  testBuilder_addQuestion_validation,
  testBuilder_editQuestion_validation,
};
