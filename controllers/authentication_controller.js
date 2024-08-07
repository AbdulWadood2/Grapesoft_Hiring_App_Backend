const AppError = require("../errorHandlers/appError");
const catchAsync = require("../errorHandlers/catchAsync");
const { promisify } = require("util");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

exports.protect = (model, role = undefined, statusForPackage = undefined) =>
  catchAsync(async (req, res, next) => {
    console.log(req.headers.jwt);
    let token;
    // RolesArray = RolesArray.length || undefined;
    // console.log(req.headers);
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      // console.log("111");
      token = req.headers.authorization.split(" ")[1];
    }
    if (!token) {
      return next(
        new AppError("You are not logged in! please login to get access", 401)
      );
    }
    const decoded = await promisify(jwt.verify)(
      token,
      `${process.env.JWT_SEC}`
    );
    let userChecks = false;
    userChecks = await model.findOne({
      _id: new mongoose.Types.ObjectId(decoded.id),
      active: true,
    });
    console.log({ userChecks });
    if (userChecks?.deleted) {
      return next(new AppError("User Deleted", 400));
    }
    if (!userChecks) {
      return next(
        new AppError("You are not logged in! please login to get access", 404)
      );
    }

    if (!userChecks) {
      return next(
        new AppError("You are not logged in! please login to get access", 401)
      );
    }
    req.user = userChecks;
    res.locals.user = userChecks;

    next();
  });
