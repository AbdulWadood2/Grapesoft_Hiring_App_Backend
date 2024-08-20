// catchAsync
const catchAsync = require("../errorHandlers/catchAsync");
// appError
const appError = require("../errorHandlers/appError");
// model
const package_model = require("../models/package_model.js");
const subscription_model = require("../models/subscription_model.js");
// successMessage
const { successMessage } = require("../successHandlers/successController");
// joi validation
const {
  packageValidationSchema,
} = require("../validation/package_joi_validation.js");

// method post
// endPoint /api/v1/package
// description create package
const createPackage = catchAsync(async (req, res, next) => {
  const { error, value } = packageValidationSchema.validate(req.body);
  if (error) {
    const errors = error.details.map((err) => err.message).join(", ");
    return next(new appError(errors, 400));
  }
  const freePackage = await package_model.findOne({
    type: 0,
  });
  if (!freePackage) {
    await package_model.create({
      title: "Free trial",
      features: ["All Access", "Enjoy All Access"],
      numberOfCredits: 200,
      type: 0,
      active: true,
    });
  }
  const createdPackage = await package_model.create({
    ...value,
  });
  return successMessage(202, res, "package created", createdPackage);
});

// method put
// endPoint /api/v1/package/:id
// description edit package
const editPackage = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { error, value } = packageValidationSchema.validate(req.body);
  if (error) {
    const errors = error.details.map((err) => err.message).join(", ");
    return next(new appError(errors, 400));
  }
  const package = await package_model.findOne({
    _id: id,
  });
  if (!package) {
    return next(new appError("package not found", 400));
  }
  if (package.type == 0) {
    if (value.pricePerCredit) {
      return next(
        new appError(
          "You cannot edit the free package with PricePerPackge",
          400
        )
      );
    }
  }

  const updatedPackage = await package_model.findByIdAndUpdate(
    id,
    { ...value },
    { new: true, runValidators: true }
  );

  if (!updatedPackage) {
    return next(new appError("Package not found", 400));
  }

  return successMessage(200, res, "Package updated", updatedPackage);
});

// method delete
// endPoint /api/v1/package/:id
// description delete package
const deletePackage = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const package = await package_model.findOne({
    _id: id,
  });
  if (!package) {
    return next(new appError("Package not found", 400));
  }
  if (package.type == 0) {
    return next(new appError("You cannot delete the free package", 400));
  }
  const deletedPackage = await package_model.findByIdAndDelete(id);

  if (!deletedPackage) {
    return next(new appError("Package not found", 400));
  }

  return successMessage(202, res, "Package deleted");
});

// method get
// endPoint /api/v1/package
// description get all packages admin
const getAllPackages = catchAsync(async (req, res, next) => {
  const freePackage = await package_model.findOne({
    type: 0,
  });
  if (!freePackage) {
    await package_model.create({
      title: "Free trial",
      features: ["All Access", "Enjoy All Access"],
      numberOfCredits: 200,
      type: 0,
      active: true,
    });
  }
  const packages = await package_model.find().sort({ type: 1, createdAt: 1 }); // Sort by type (0 first, 1 second) and then by createdAt in descending order

  if (!packages.length) {
    return next(new appError("No packages found", 400));
  }

  return successMessage(200, res, "Packages retrieved", packages);
});

// method GET
// endPoint /api/v1/package/get/employer
// description get all packages employer
const getEmployerPackages = catchAsync(async (req, res, next) => {
  const freePackage = await package_model.findOne({
    type: 0,
  });
  if (!freePackage) {
    await package_model.create({
      title: "Free trial",
      features: ["All Access", "Enjoy All Access"],
      numberOfCredits: 200,
      type: 0,
      active: true,
    });
  }
  const subscription = await subscription_model.findOne({
    employerId: req.user.id,
  });
  const packages = await package_model.find({ type: 1 }).sort({ createdAt: 1 });

  return successMessage(200, res, "Packages retrieved", {
    currentSubscription: subscription,
    packages,
  });
});

// method put
// endPoint /api/v1/package/freeStatus/edit
// description edit free package status
const editPackageStatus = catchAsync(async (req, res, next) => {
  let freePackage = await package_model.findOne({
    type: 0,
  });
  if (!freePackage) {
    await package_model.create({
      title: "Free trial",
      features: ["All Access", "Enjoy All Access"],
      numberOfCredits: 200,
      type: 0,
      active: true,
    });
    freePackage = await package_model.findOne({
      type: 0,
    });
    freePackage.active = !freePackage.active;
    await freePackage.save();
  } else {
    freePackage.active = !freePackage.active;
    await freePackage.save();
  }
  if (freePackage.active) {
    return successMessage(
      200,
      res,
      "Free Package status activated",
      freePackage
    );
  } else {
    return successMessage(200, res, "Free Package turned off", freePackage);
  }
});

module.exports = {
  createPackage,
  editPackage,
  deletePackage,
  getAllPackages,
  getEmployerPackages,
  editPackageStatus,
};
