const { transport } = require("../index");

const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Candidate Contract Signed</title>
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
    </style>
</head>

<body>
    <div class="container">
        <div class="header">
            <h2>Contract Signed by [Candidate's Name]</h2>
        </div>
        <div class="content">
            <p>Dear [Employer's Name],</p>

            <p>We are pleased to inform you that <strong>[Candidate's Name]</strong> has successfully signed the contract for the <strong>[Job Title]</strong> position at <strong>[Company Name]</strong>.</p>

            <p>You can view the signed contract and manage further actions by logging into your employer dashboard:</p>

            <p><a href="${process.env.FRONTEND_BASE_URL}/employerDashboard/application/[Job Application Id]/contract" style="
  display: inline-block;
  margin: 20px 0;
  padding: 10px 20px;
  background-color: #007BFF;
  color: #FFFFFF;
  text-decoration: none;
  border-radius: 5px;
  font-weight: bold;
">View Signed Contract</a></p>

            <p>If you have any questions or need further assistance, please don't hesitate to reach out.</p>

            <p>Best regards,</p>

            <p>[Your Company Name]</p>
        </div>
    </div>
</body>
</html>
`;

module.exports = class CandidateSignedContractEmail {
  constructor(employer, payload) {
    this.to = employer.email;
    this.candidateName = payload.candidateName;
    this.employerName = payload.employerName || "Employer";
    this.jobTitle = payload.jobTitle;
    this.jobApplyId = payload.jobApplyId;
    this.companyName = payload.companyName;
    this.from = `${process.env.NODEMAILER_EMAIL}`;
  }

  newTransport() {
    return transport();
  }

  async send() {
    const mailOptions = {
      from: "Grapesoft Interview App",
      to: this.to,
      subject: "Candidate Contract Signed",
      html: html
        .replaceAll("[Candidate's Name]", this.candidateName)
        .replaceAll("[Employer's Name]", this.employerName)
        .replaceAll("[Job Title]", this.jobTitle)
        .replaceAll("[Job Application Id]", this.jobApplyId)
        .replaceAll("[Company Name]", this.companyName)
        .replaceAll("[Your Company Name]", "Grapesoft"),
    };

    await this.newTransport().sendMail(mailOptions);
  }

  async sendEmail() {
    await this.send();
  }
};
