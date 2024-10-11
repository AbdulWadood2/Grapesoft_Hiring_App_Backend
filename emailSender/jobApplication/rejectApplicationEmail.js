const { transport } = require("../index");

const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Application Status Update</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f9f9f9; margin: 0; padding: 20px;">

    <table align="center" width="600" style="background-color: #ffffff; border: 1px solid #dddddd; padding: 20px;">
        <tr>
            <td style="text-align: center; padding-bottom: 20px;">
                <h2 style="color: #333333; margin: 0;">Job Application Update</h2>
            </td>
        </tr>
        <tr>
            <td>
                <p style="color: #333333; font-size: 16px; line-height: 1.5; margin: 0;">
                    Dear [Candidate's Name],
                </p>
                <p style="color: #333333; font-size: 16px; line-height: 1.5; margin: 20px 0 0 0;">
                    Thank you for taking the time to apply for the [Job Title] position at [Company Name]. We appreciate your interest in our company and the effort you put into your application.
                </p>
                <p style="color: #333333; font-size: 16px; line-height: 1.5; margin: 20px 0 0 0;">
                    After careful consideration, we regret to inform you that we have decided not to move forward with your application at this time. This decision was not easy as we received applications from many qualified candidates.
                </p>
                <p style="color: #333333; font-size: 16px; line-height: 1.5; margin: 20px 0 0 0;">
                    We encourage you to apply for future openings that match your skills and experience. We will keep your resume on file and may contact you if a suitable opportunity arises.
                </p>
                <p style="color: #333333; font-size: 16px; line-height: 1.5; margin: 20px 0 0 0;">
                    Thank you again for your interest in joining our team. We wish you the best of luck in your job search and future endeavors.
                </p>
                <p style="color: #333333; font-size: 16px; line-height: 1.5; margin: 20px 0 0 0;">
                    Sincerely,
                </p>
                <p style="color: #333333; font-size: 16px; line-height: 1.5; margin: 0;">
                    [Company Name]
                </p>
            </td>
        </tr>
    </table>

</body>
</html>
`;

module.exports = class rejectApplicationEmail {
  constructor(user, payload) {
    this.to = user.email;
    this.companyName = payload.companyName;
    this.candidateName = payload.candidateName;
    this.jobTitle = payload.jobTitle;
    this.from = `${process.env.NODEMAILER_EMAIL}`;
  }
  newTransport() {
    return transport();
  }
  async send() {
    const mailOptions = {
      from: "Mantiqsoft inteview app",
      to: this.to,
      subject: "Application rejected",
      html: html
        .replaceAll("[Company Name]", this.companyName)
        .replaceAll("[Candidate's Name]", this.candidateName)
        .replaceAll("[Job Title]", this.jobTitle),
      //   html:
    };

    await this.newTransport().sendMail(mailOptions);
  }
  async sendEmail() {
    await this.send();
  }
};
