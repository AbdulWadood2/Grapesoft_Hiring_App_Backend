// swagger
const basicAuth = require("express-basic-auth");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./swaggerConfig");
const { SwaggerTheme } = require("swagger-themes");
const theme = new SwaggerTheme();
const options = {
  explorer: true,
  customCss: theme.getBuffer("dark") + ".swagger-ui .topbar { display: none }",
};
const swaggerUseMiddleWare = (app) => {
  app.use(
    "/api-docs",
    basicAuth({
      users: {
        [process.env.SWAGGER_USERNAME]: process.env.SWAGGER_PASSWORD,
      }, // replace 'admin' and 'supersecret' with your username and password
      challenge: true,
      realm: "Imb4T3st4pp",
    }),
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, options)
  );
};
module.exports = swaggerUseMiddleWare;
