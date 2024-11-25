require("dotenv").config(); // Load environment variables
const Hapi = require("@hapi/hapi");
const routes = require("../server/routes"); // Load routes from dedicated file
const loadModel = require("../services/loadModel"); // Load model from service
const InputError = require("../exceptions/InputError"); // Handle custom input errors

(async () => {
  try {
    // Initialize server with basic configuration
    const server = Hapi.server({
      port: process.env.PORT || 3000, // Use environment variable for port
      host: "0.0.0.0",
      routes: {
        cors: {
          origin: ["*"], // Allow all origins for now (consider restrictions in production)
        },
      },
    });

    // Load the model asynchronously
    const model = await loadModel();
    server.app.model = model; // Make model accessible to routes

    // Register all routes defined in the routes module
    server.route(routes);

    // Custom middleware to handle InputError and Boom errors
    server.ext("onPreResponse", async function (request, h) {
      const response = request.response;

      if (response instanceof InputError) {
        return h.response({
          status: "fail",
          message: `${response.message} Silakan gunakan foto lain.`,
        }).code(response.statusCode);
      }

      if (response.isBoom) {
        return h.response({
          status: "fail",
          message: response.message,
        }).code(response.output.statusCode);
      }

      return h.continue;
    });

    // Start the server asynchronously and handle potential errors
    await server.start();
    console.log(`Server started at: ${server.info.uri}`); // Corrected output message
  } catch (error) {
    console.error("Error starting server:", error);
    process.exit(1); // Exit with non-zero code to indicate failure
  }
})();
