const express = require("express");
require("dotenv").config();
const connectionDb = require("./config/Db.js");
const cors = require("cors");
// body parser
const bodyParser = require("body-parser");

// routes
const employer_routes = require("./routes/employer_routes.js");
const candidate_routes = require("./routes/candidate_routes.js");
const s3_routes = require("./routes/s3upload_routes.js");
const testBuilder_routes = require("./routes/testBuilder_routes.js");
const job_routes = require("./routes/job_routes.js");
const admin_routes = require("./routes/admin_routes.js");
const helpguideemployer_routes = require("./routes/help&guideEmployer_routes.js");
const helpguidecandidate_routes = require("./routes/help&guideCandidate_routes.js");
const package_routes = require("./routes/package_routes.js");
const subscription_routes = require("./routes/subscription_routes.js");
const candiadteJobs_routes = require("./routes/candidateJobs_routes.js");
const jobApplication_routes = require("./routes/jobApplications_route.js");
const testPermissions_routes = require("./routes/testPermisions_routes.js");
const test_routes = require("./routes/test_routes.js");
const notification_routes = require("./routes/notification_routes.js");
const stripeKey_routes = require("./routes/stripeKey_routes.js");

const app = express();
app.use(
  cors({
    origin: [
      "https://adminhiring.mantiqsoft.com",
      "https://hiring.mantiqsoft.com",
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:3002",
      "http://localhost:3003",
      "http://192.168.0.173:3000",
    ],
    credentials: true,
  })
);

app.options("*", cors());
// Stripe webhook route with raw body parser
app.use(
  "/api/v1/subscription/success",
  bodyParser.raw({ type: "application/json" })
);
// app.use(express.urlencoded({ extended: true }));
// app.use(express.json());

// Apply bodyParser for all other routes after the webhook
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

/* routes */
app.use("/api/v1/employer", employer_routes);
app.use("/api/v1/candidate", candidate_routes);
app.use("/api/v1/s3", s3_routes);
app.use("/api/v1/testBuilder", testBuilder_routes);
app.use("/api/v1/job", job_routes);
app.use("/api/v1/admin", admin_routes);
app.use("/api/v1/helpguideemployer", helpguideemployer_routes);
app.use("/api/v1/helpguidecandidate", helpguidecandidate_routes);
app.use("/api/v1/package", package_routes);
app.use("/api/v1/subscription", subscription_routes);
app.use("/api/v1/candidateJob", candiadteJobs_routes);
app.use("/api/v1/jobApplication", jobApplication_routes);
app.use("/api/v1/testPermissions", testPermissions_routes);
app.use("/api/v1/test", test_routes);
app.use("/api/v1/notification", notification_routes);
app.use("/api/v1/stripe-key", stripeKey_routes);

// Connect to MongoDB
connectionDb().catch((error) => {
  console.error("Failed to connect to the database:", error);
  process.exit(1); // Exit the process with failure
});

const appError = require("./errorHandlers/appError.js");
const globalErrorHandler = require("./errorHandlers/errorController.js");

const swaggerUseMiddleWare = require("./swagger/swaggermain.js");
swaggerUseMiddleWare(app);

app.use(globalErrorHandler);

app.all("*", (req, res, next) => {
  next(new appError(`Cant find ${req.originalUrl} on this server`, 400));
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
