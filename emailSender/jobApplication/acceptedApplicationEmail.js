const { transport } = require("../index");

const html = `<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f4f4f4;
      margin: 0;
      padding: 0;
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
      <h2>Welcome to [Company Name]</h2>
    </div>
    <div class="content">
      <p>Dear [Candidate's Name],</p>

      <p>Thank you for your interest in the <strong>[Job Title]</strong> position at <strong>[Company Name]</strong>.</p>

      <p>We are excited to move forward with your application. To proceed, we need you to complete your signup process. Once your signup is complete, you will be able to access and take the required online test, which is the next step in our hiring process.</p>

      <p>Please click the link below to complete your signup:</p>

      <p><a href="${process.env.SERVER_BASE_URL}/jobApplication/redirectToTest?jobId=[jobId]&candidateEmail=[candidateEmail]" style="
  display: inline-block;
  margin: 20px 0;
  padding: 10px 20px;
  background-color: #007BFF;
  color: #FFFFFF; /* Ensure text color is white */
  text-decoration: none;
  border-radius: 5px;
  font-weight: bold;
">Complete Your Signup</a></p>

      <p>After completing the signup, you will receive further instructions on how to access the online test.</p>

      <p>If you have any questions or need assistance at any stage, feel free to reply to this email.</p>

      <p>We look forward to seeing you demonstrate your skills and moving ahead in the selection process!</p>

      <p>Best regards,</p>

      <p>[Your Name]<br>
        [Company Name]</p>
    </div>
    <div class="footer">
      <p>If you didn't apply for this job, please ignore this email or <a href="#">unsubscribe</a>.</p>
    </div>
  </div>
</body>

</html>

`;

module.exports = class AcceptedApplicationEmail {
  constructor(user, payload) {
    this.to = user.email;
    this.candidateEmail = payload.candidateEmail;
    this.jobId = payload.jobId;
    this.companyName = payload.companyName;
    this.candidateName = payload.candidateName;
    this.jobTitle = payload.jobTitle;
    this.employerName = payload.employerName;
    this.from = `${process.env.NODEMAILER_EMAIL}`;
  }
  newTransport() {
    return transport();
  }
  async send() {
    const mailOptions = {
      from: "Grapesoft inteview app",
      to: this.to,
      subject: "Application accepted",
      html: html
        .replaceAll("[candidateEmail]", this.candidateEmail)
        .replaceAll("[jobId]", this.jobId)
        .replaceAll("[Company Name]", this.companyName)
        .replaceAll("[Candidate's Name]", this.candidateName)
        .replaceAll("[Job Title]", this.jobTitle)
        .replaceAll("[Your Name]", this.employerName),
      //   html:
    };

    await this.newTransport().sendMail(mailOptions);
  }
  async sendEmail() {
    await this.send();
  }
};
