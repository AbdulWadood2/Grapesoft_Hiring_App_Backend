const { transport } = require("../index");

const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Job Application</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 20px;
        }

        .container {
            width: 100%;
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }

        .header {
            text-align: center;
            padding: 10px 0;
            background-color: #007BFF;
            color: white;
            border-radius: 8px 8px 0 0;
        }

        .content {
            padding: 20px;
            font-size: 16px;
            line-height: 1.6;
            color: #333333;
        }

        .footer {
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #777777;
        }

        .footer a {
            color: #007BFF;
            text-decoration: none;
        }

        .button {
            display: inline-block;
            margin: 20px 0;
            padding: 10px 20px;
            background-color: #007BFF;
            color: #FFFFFF;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
        }
    </style>
</head>

<body>
    <div class="container">
        <div class="header">
            <h2>New Job Application Alert</h2>
        </div>
        <div class="content">
            <p>Dear [Employer's Name],</p>

            <p>A new candidate, <strong>[Candidate's Name]</strong>, has applied for the <strong>[Job Title]</strong> position at your company.</p>

            <p>You can view the candidate's application details by clicking the link below:</p>

            <p><a href="${process.env.FRONTEND_BASE_URL}/employerDashboard/application/[jobApplyId]" class="button">View Application</a></p>

            <p>If you have any questions or need further assistance, feel free to reply to this email.</p>

            <p>Best regards,</p>

            <p>[Your Company Name]</p>
        </div>
    </div>
</body>
</html>
`;

module.exports = class NewApplicationEmail {
  constructor(employer, payload) {
    this.to = employer.email;
    this.employerName = payload.employerName;
    this.candidateName = payload.candidateName;
    this.jobTitle = payload.jobTitle;
    this.jobApplyId = payload.jobApplyId;
    this.from = `${process.env.NODEMAILER_EMAIL}`;
  }

  newTransport() {
    return transport();
  }

  async send() {
    const mailOptions = {
      from: "Mantiqsoft interview app",
      to: this.to,
      subject: "New Candidate Application",
      html: html
        .replaceAll("[Employer's Name]", this.employerName)
        .replaceAll("[Candidate's Name]", this.candidateName)
        .replaceAll("[Job Title]", this.jobTitle)
        .replaceAll("[jobApplyId]", this.jobApplyId)
        .replaceAll("[Your Company Name]", "Mantiqsoft"),
    };

    await this.newTransport().sendMail(mailOptions);
  }

  async sendEmail() {
    await this.send();
  }
};
