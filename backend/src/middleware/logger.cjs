const morgan = require("morgan");

morgan.token("body", (req) => JSON.stringify(req.body) || "{}");

const logFormat =
  ":method :url :status :response-time ms - :res[content-length] | Body: :body";

const logger = morgan(logFormat);

module.exports = logger;
