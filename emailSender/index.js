const nodemailer = require("nodemailer");
const auth = {
  user: process.env.NODEMAILER_EMAIL,
  pass: process.env.NODEMAILER_PASSWORD,
};

function transport() {
  return nodemailer.createTransport({
    service: "gmail",
    auth,
  });
}

module.exports = {
  transport,
};
