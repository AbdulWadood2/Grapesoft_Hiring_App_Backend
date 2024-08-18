// catchAsync
const catchAsync = require("../errorHandlers/catchAsync");
const appError = require("../errorHandlers/appError");
const {
  helpGuideEmployerValidationSchema,
} = require("../validation/help&guideEmployer_joi_validation");
// model
const helpguideEmployer_model = require("../models/help&guideEmployer_model");
const {
  checkDuplicateAwsImgsInRecords,
  checkImageExists,
  getFileName,
} = require("../functions/aws_functions");
const { generateSignedUrl } = require("./awsController");

// method post
// endPoint /api/v1/helpguideemployer/
// description create employer help and guide
const createHelpGuideEmployer = catchAsync(async (req, res, next) => {
  const { error, value } = helpGuideEmployerValidationSchema.validate(req.body);
  if (error) {
    const errors = error.details.map((err) => err.message).join(", ");
    return next(new AppError(errors, 400));
  }
  const helpguideEmployerCount = await helpguideEmployer_model.countDocuments();
  const isImageExists = checkImageExists([helpguideEmployerCount.video]);
  if (!isImageExists) {
    return next(new appError("Video does not exist", 400));
  }
  const imageAlreadyUsed = checkDuplicateAwsImgsInRecords([
    helpguideEmployerCount.video,
  ]);
  if (!imageAlreadyUsed.success) {
    return next(new appError("Video is already used", 400));
  }
  const helpguideEmployerCreated = await helpguideEmployer_model.create({
    ...value,
    sort: helpguideEmployerCount + 1,
  });
  if (helpguideEmployerCreated.video) {
    [helpguideEmployerCreated.video] = await generateSignedUrl([
      helpguideEmployerCreated.video,
    ]);
  }
  return successMessage(
    202,
    res,
    "help and guide created",
    helpguideEmployerCreated
  );
});

// method get
// endPoint /api/v1/helpguideemployer/
// description get employer help and guide
const getAllHelpGuideEmployers = catchAsync(async (req, res, next) => {
  const helpGuideEmployers = await helpguideEmployer_model
    .find()
    .sort({ sort: 1 });
  return successMessage(
    200,
    res,
    "All help and guide questionnaires",
    helpGuideEmployers
  );
});

// method edit
// endPoint /api/v1/helpguideemployer/
// description edit employer help and guide
const editHelpGuideEmployer = catchAsync(async (req, res, next) => {
  const { error, value } = helpGuideEmployerValidationSchema.validate(req.body);
  if (error) {
    const errors = error.details.map((err) => err.message).join(", ");
    return next(new appError(errors, 400));
  }

  const helpAndguideEmployerExist = await helpguideEmployer_model.findOne({
    _id: req.params.id,
  });
  value.video = value.video ? (await getFileName([value.video]))[0] : null;

  if (value.video) {
    if (helpAndguideEmployerExist.video) {
      if (value.video !== helpAndguideEmployerExist.video) {
        const isImageExists = checkImageExists([value.video]);
        if (!isImageExists) {
          return next(new appError("Video does not exist", 400));
        }
        const imageAlreadyUsed = checkDuplicateAwsImgsInRecords([value.video]);
        if (!imageAlreadyUsed.success) {
          return next(new appError("Video is already used", 400));
        }
      }
    } else {
      const isImageExists = checkImageExists([value.video]);
      if (!isImageExists) {
        return next(new appError("Video does not exist", 400));
      }
      const imageAlreadyUsed = checkDuplicateAwsImgsInRecords([value.video]);
      if (!imageAlreadyUsed.success) {
        return next(new appError("Video is already used", 400));
      }
    }
  }

  const helpGuideEmployer = await helpguideEmployer_model.findByIdAndUpdate(
    req.params.id,
    value,
    {
      new: true,
      runValidators: true,
    }
  );

  if (!helpGuideEmployer) {
    return next(new AppError("No help and guide found with that ID", 400));
  }
  if (helpGuideEmployer.video) {
    [helpGuideEmployer.video] = await generateSignedUrl([
      helpGuideEmployer.video,
    ]);
  }

  return successMessage(200, res, "Help and guide updated", helpGuideEmployer);
});

// method delete
// endPoint /api/v1/helpguideemployer/
// description delete employer help and guide
const deleteHelpGuideEmployer = catchAsync(async (req, res, next) => {
  const helpGuideEmployer = await helpguideEmployer_model.findByIdAndDelete(
    req.params.id
  );

  if (!helpGuideEmployer) {
    return next(new appError("No help and guide found with that ID", 404));
  }

  return successMessage(204, res, "Help and guide deleted");
});

// method edit
// endPoint /api/v1/helpguideemployer/sort/
// description edit employer help and guide sort
const editHelpGuideEmployerSort = catchAsync(async (req, res, next) => {
  const { sort } = req.body;

  if (sort === undefined) {
    return next(new appError("Sort value is required", 400));
  }

  // Find the current item
  const currentHelpGuideEmployer = await helpguideEmployer_model.findById(
    req.params.id
  );
  if (!currentHelpGuideEmployer) {
    return next(new appError("No help and guide found with that ID", 404));
  }

  const currentSort = currentHelpGuideEmployer.sort;

  // If the new sort value is different from the current sort value
  if (currentSort !== sort) {
    // Increment sort value for items that need to move up
    if (sort < currentSort) {
      await helpguideEmployer_model.updateMany(
        { sort: { $gte: sort, $lt: currentSort } },
        { $inc: { sort: 1 } }
      );
    }
    // Decrement sort value for items that need to move down
    else if (sort > currentSort) {
      await helpguideEmployer_model.updateMany(
        { sort: { $gt: currentSort, $lte: sort } },
        { $inc: { sort: -1 } }
      );
    }

    // Update the current item's sort value
    currentHelpGuideEmployer.sort = sort;
    await currentHelpGuideEmployer.save();
  }
  if (currentHelpGuideEmployer.video) {
    [currentHelpGuideEmployer.video] = await generateSignedUrl([
      currentHelpGuideEmployer.video,
    ]);
  }
  return successMessage(
    200,
    res,
    "Sort order updated",
    currentHelpGuideEmployer
  );
});

module.exports = {
  createHelpGuideEmployer,
  getAllHelpGuideEmployers,
  editHelpGuideEmployer,
  deleteHelpGuideEmployer,
  editHelpGuideEmployerSort,
}; // Export your function
