// catchAsync
const catchAsync = require("../errorHandlers/catchAsync");
const appError = require("../errorHandlers/appError");
const {
  helpGuideCandidateValidationSchema,
} = require("../validation/help&guideCandidate_joi_validation");
// model
const helpguideCandidate_model = require("../models/help&guideCandidate_model");
const {
  checkDuplicateAwsImgsInRecords,
  checkImageExists,
  getFileName,
} = require("../functions/aws_functions");
const { generateSignedUrl } = require("./awsController");
const { successMessage } = require("../successHandlers/successController");

// method post
// endPoint /api/v1/helpguidecandidate/
// description create candidate help and guide
const createHelpGuidecandidate = catchAsync(async (req, res, next) => {
  const { error, value } = helpGuideCandidateValidationSchema.validate(
    req.body
  );
  if (error) {
    const errors = error.details.map((err) => err.message).join(", ");
    return next(new appError(errors, 400));
  }
  const helpguidecandidateCount =
    await helpguideCandidate_model.countDocuments();
  if (value.video) {
    const [isImageExists] = await checkImageExists([value.video]);
    if (!isImageExists) {
      return next(new appError("Video does not exist", 400));
    }
    const imageAlreadyUsed = await checkDuplicateAwsImgsInRecords([
      value.video,
    ]);
    if (!imageAlreadyUsed.success) {
      return next(new appError("Video is already used", 400));
    }
  }
  const helpguidecandidateCreated = await helpguideCandidate_model.create({
    ...value,
    sort: helpguidecandidateCount + 1,
  });
  if (helpguidecandidateCreated.video) {
    [helpguidecandidateCreated.video] = await generateSignedUrl([
      helpguidecandidateCreated.video,
    ]);
  }
  return successMessage(
    202,
    res,
    "help and guide created",
    helpguidecandidateCreated
  );
});

// method get
// endPoint /api/v1/helpguidecandidate/
// description get candidate help and guide
const getAllHelpGuidecandidates = catchAsync(async (req, res, next) => {
  let helpGuidecandidates = await helpguideCandidate_model
    .find()
    .sort({ sort: 1 });
  helpGuidecandidates = helpGuidecandidates.map(async (item) => {
    if (item.video) {
      [item.video] = await generateSignedUrl([item.video]);
    }
    return item;
  });
  helpGuidecandidates = await Promise.all(helpGuidecandidates);
  return successMessage(
    200,
    res,
    "All help and guide questionnaires",
    helpGuidecandidates
  );
});

// method edit
// endPoint /api/v1/helpguidecandidate/
// description edit candidate help and guide
const editHelpGuidecandidate = catchAsync(async (req, res, next) => {
  const { error, value } = helpGuideCandidateValidationSchema.validate(
    req.body
  );
  if (error) {
    const errors = error.details.map((err) => err.message).join(", ");
    return next(new appError(errors, 400));
  }

  const helpAndguidecandidateExist = await helpguideCandidate_model.findOne({
    _id: req.params.id,
  });
  value.video = value.video ? (await getFileName([value.video]))[0] : null;

  if (value.video) {
    if (helpAndguidecandidateExist.video) {
      if (value.video !== helpAndguidecandidateExist.video) {
        const [isImageExists] = await checkImageExists([value.video]);
        if (!isImageExists) {
          return next(new appError("Video does not exist", 400));
        }
        const imageAlreadyUsed = await checkDuplicateAwsImgsInRecords([
          value.video,
        ]);
        if (!imageAlreadyUsed.success) {
          return next(new appError("Video is already used", 400));
        }
      }
    } else {
      const [isImageExists] = await checkImageExists([value.video]);
      if (!isImageExists) {
        return next(new appError("Video does not exist", 400));
      }
      const imageAlreadyUsed = await checkDuplicateAwsImgsInRecords([
        value.video,
      ]);
      if (!imageAlreadyUsed.success) {
        return next(new appError("Video is already used", 400));
      }
    }
  }

  const helpGuidecandidate = await helpguideCandidate_model.findByIdAndUpdate(
    req.params.id,
    value,
    {
      new: true,
      runValidators: true,
    }
  );

  if (!helpGuidecandidate) {
    return next(new AppError("No help and guide found with that ID", 400));
  }
  if (helpGuidecandidate.video) {
    [helpGuidecandidate.video] = await generateSignedUrl([
      helpGuidecandidate.video,
    ]);
  }

  return successMessage(200, res, "Help and guide updated", helpGuidecandidate);
});

// method delete
// endPoint /api/v1/helpguidecandidate/:id
// description delete candidate help and guide
const deleteHelpGuidecandidate = catchAsync(async (req, res, next) => {
  const helpGuidecandidate = await helpguideCandidate_model.findByIdAndDelete(
    req.params.id
  );

  if (!helpGuidecandidate) {
    return next(new appError("No help and guide found with that ID", 400));
  }

  return successMessage(202, res, "Help and guide deleted");
});

// method edit
// endPoint /api/v1/helpguidecandidate/sort/
// description edit candidate help and guide sort
const editHelpGuidecandidateSort = catchAsync(async (req, res, next) => {
  const { sort } = req.body;

  if (sort === undefined) {
    return next(new appError("Sort value is required", 400));
  }
  if (sort === 0) {
    return next(new appError("Sort value must be > 0", 400));
  }

  // Find the current item
  const currentHelpGuidecandidate = await helpguideCandidate_model.findById(
    req.params.id
  );
  if (!currentHelpGuidecandidate) {
    return next(new appError("No help and guide found with that ID", 404));
  }

  const currentSort = currentHelpGuidecandidate.sort;

  // If the new sort value is different from the current sort value
  // if (currentSort !== sort) {
  // Increment sort value for items that need to move up
  if (sort <= currentSort) {
    await helpguideCandidate_model.updateMany(
      { sort: { $gte: sort, $lt: currentSort } },
      { $inc: { sort: 1 } }
    );
  }
  // Decrement sort value for items that need to move down
  else if (sort > currentSort) {
    await helpguideCandidate_model.updateMany(
      { sort: { $gt: currentSort, $lte: sort } },
      { $inc: { sort: -1 } }
    );
  }

  // Update the current item's sort value
  currentHelpGuidecandidate.sort = sort;
  await currentHelpGuidecandidate.save();
  // }
  if (currentHelpGuidecandidate.video) {
    [currentHelpGuidecandidate.video] = await generateSignedUrl([
      currentHelpGuidecandidate.video,
    ]);
  }
  return successMessage(
    200,
    res,
    "Sort order updated",
    currentHelpGuidecandidate
  );
});

module.exports = {
  createHelpGuidecandidate,
  getAllHelpGuidecandidates,
  editHelpGuidecandidate,
  deleteHelpGuidecandidate,
  editHelpGuidecandidateSort,
}; // Export your function
