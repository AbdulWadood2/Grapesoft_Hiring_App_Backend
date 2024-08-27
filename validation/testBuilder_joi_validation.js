const Joi = require("joi");

const testBuilder_create_validation = Joi.object({
  testName: Joi.string().required(),
  testTime: Joi.number().required(),
  questions: Joi.array()
    .items(
      Joi.object({
        type: Joi.number().integer().valid(0, 1, 2).required(),
        questionText: Joi.string().required(),
        wordLimit: Joi.alternatives()
          .try(
            Joi.when("type", {
              is: 1,
              then: Joi.number().integer().required(),
              otherwise: Joi.valid(null),
            })
          )
          .allow(null),
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
        wordLimit: Joi.alternatives()
          .try(
            Joi.when("type", {
              is: 0,
              then: Joi.number().integer().required(),
              otherwise: Joi.valid(null),
            })
          )
          .allow(null),
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
const submittest_question_validation = Joi.object({
  questions: Joi.array()
    .items(
      Joi.object({
        type: Joi.number().integer().valid(0, 1, 2).required(),
        questionText: Joi.string().required(),
        wordLimit: Joi.number().allow(null),
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
        fileAnswer: Joi.alternatives()
          .try(
            Joi.when("type", {
              is: 0,
              then: Joi.string(), // Ensures the answer is a required string when type is 0
              otherwise: Joi.when("type", {
                is: 2,
                then: Joi.string().required(), // Allows an empty string or null when type is 2
                otherwise: Joi.string().required(), // For all other types, a valid string answer is required
              }),
            })
          )
          .allow(null),
        answer: Joi.string().allow(null),
        isCorrect: Joi.alternatives()
          .try(
            Joi.when("type", {
              is: 1,
              then: Joi.boolean().required(), // Ensures the answer is an empty string when type is 3
              otherwise: Joi.valid(null), // For other types, a valid string answer is required
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
  wordLimit: Joi.alternatives()
    .try(
      Joi.when("type", {
        is: 0,
        then: Joi.number().integer().required(),
        otherwise: Joi.valid(null),
      })
    )
    .allow(null),
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
  submittest_question_validation,
  testBuilder_editQuestion_validation,
};
