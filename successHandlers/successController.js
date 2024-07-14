let successMessage = (statusCode, res, message, data) => {
  return res.status(statusCode).json({
    status: "success",
    data,
    message,
  });
};

module.exports = {
  successMessage,
};
