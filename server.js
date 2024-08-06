const express = require("express");
require("dotenv").config();
const connectionDb = require("./config/Db.js");
const cors = require("cors");
const employer_routes = require("./routes/employer_routes.js");
const candidate_routes = require("./routes/candidate_routes.js");
const s3_routes = require("./routes/s3upload_routes.js");

const app = express();
app.use(
  cors({
    origin: ["http://localhost:3001"],
    credentials: true,
  })
);

app.options("*", cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

/* routes */
app.use("/api/v1/employer", employer_routes);
app.use("/api/v1/candidate", candidate_routes);
app.use("/api/v1/s3", s3_routes);

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
