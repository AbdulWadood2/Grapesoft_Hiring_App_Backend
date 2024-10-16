const nodemailer = require("nodemailer");
const { transport } = require("../index");
// const pug = require("pug");
const html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Verification Code</title>
    <style>
        body {
            background-color: #f0f0f0;
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
        }
        .email-container {
            background-color: #ffffff;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            border-radius: 5px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }
        h1 {
            color: #333;
        }
        p {
            color: #555;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <h1>Verification Code</h1>
        
        <p>Dear User,</p>
        
        <p>Your verification code is: <strong style="color: #0077b6;">#code#</strong></p>
        
        <p>Please use this code to complete your verification process.</p>
        
        <p>Thank you for using our service.</p>
    </div>
</body>
</html>
`;

module.exports = class ForgetPasswordEmail {
  constructor(user, resetcode) {
    this.to = user.email;
    this.resetcode = resetcode;
    this.from = `${process.env.NODEMAILER_EMAIL}`;
  }
  newTransport() {
    return transport();
  }
  async send() {
    const mailOptions = {
      from: "Mantiqsoft inteview app",
      to: this.to,
      subject: "Mantiqsoft verification code",
      html: html.replace("#code#", this.resetcode),
      //   html:
    };

    await this.newTransport().sendMail(mailOptions);
  }
  async sendVerificationCode() {
    await this.send();
  }
};
