// catchAsync
const catchAsync = require("../errorHandlers/catchAsync");
// appError
const appError = require("../errorHandlers/appError");
// model
const testPermissions_model = require("../models/testPermissions_model");
// successMessage
const { successMessage } = require("../successHandlers/successController");
// joi validation
const {
  testPermissionsJoiSchema,
} = require("../validation/testPermissions_joi_validation");

// method get
// endPoint /api/v1/testPermissions/
// description edit test permmsions
const getTestPermissions = catchAsync(async (req, res, next) => {
  const testPermissions = await testPermissions_model.findOne();
  successMessage(
    200,
    res,
    "Test permissions get successfully",
    testPermissions
  );
});

// method put
// endPoint /api/v1/testPermissions/
// description edit test permmsions
const editTestPermissions = catchAsync(async (req, res, next) => {
  const { value, error } = testPermissionsJoiSchema.validate(req.body);
  if (error) {
    const errors = error.details.map((err) => err.message).join(", ");
    return next(new appError(400, errors));
  }
  const editTestPermissions = await testPermissions_model.findOneAndUpdate(
    {},
    {
      $set: value,
    },
    {
      new: true,
    }
  );
  successMessage(
    200,
    res,
    "Test permissions update successfully",
    editTestPermissions
  );
});

module.exports = {
  getTestPermissions,
  editTestPermissions,
};
