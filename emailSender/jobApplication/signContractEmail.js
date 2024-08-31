const { transport } = require("../index");

const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sign Contract</title>
</head>
<body style="margin: 0; padding: 0; width: 100%; height: 100%; background-color: #f4f4f4;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
            <td align="center" bgcolor="#f4f4f4">
                <table width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width: 600px; border-collapse: collapse;">
                    <tr>
                        <td align="left" bgcolor="#ffffff" style="padding: 20px; font-family: Arial, sans-serif; font-size: 16px; line-height: 1.5; color: #333333;">
                            <h2 style="font-size: 24px; margin: 0 0 20px 0;">Hello [Candidate Name],</h2>
                            <p style="margin: 0 0 20px 0;">We are excited to have you move forward in the process. To complete the next step, please sign the contract using the button below:</p>
                            <p style="margin: 20px 0;">
                                <a href="${process.env.FRONTEND_BASE_URL}/signContract/[jobApplyId]" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: #ffffff; text-decoration: none; border-radius: 5px; font-size: 18px;">Sign Contract</a>
                            </p>
                            <p style="margin: 0 0 20px 0;">If you have any questions or need assistance, feel free to contact us at any time.</p>
                            <p style="margin: 0;">Best regards,<br>Your Company Name</p>
                        </td>
                    </tr>
                    <tr>
                        <td align="center" bgcolor="#f4f4f4" style="padding: 20px; font-family: Arial, sans-serif; font-size: 14px; color: #aaaaaa;">
                            © 2024 [Your Company Name]. All rights reserved.
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>

`;

module.exports = class signContractApplicationEmail {
  constructor(user, payload) {
    this.to = user.email;
    this.candidateName = payload.candidateName;
    this.companyName = payload.companyName;
    this.jobApplyId = payload.jobApplyId;
    this.from = `${process.env.NODEMAILER_EMAIL}`;
  }
  newTransport() {
    return transport();
  }
  async send() {
    const mailOptions = {
      from: "Grapesoft inteview app",
      to: this.to,
      subject: "Passed test - SIGN CONTRACT PLZ",
      html: html
        .replaceAll("[Candidate Name]", this.candidateName)
        .replaceAll("[Your Company Name]", this.companyName)
        .replaceAll("[jobApplyId]", this.jobApplyId),
      //   html:
    };

    await this.newTransport().sendMail(mailOptions);
  }
  async sendEmail() {
    await this.send();
  }
};
