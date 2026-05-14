// middleware/errorMiddleware.js
// Centralised error handler — always the LAST middleware in server.js.
// Any route that calls next(err) or throws inside an async wrapper
// ends up here, keeping error formatting consistent.

const errorHandler = (err, req, res, next) => {
  // Default to 500 if Express hasn't set a status code yet
  const statusCode = res.statusCode && res.statusCode !== 200
    ? res.statusCode
    : 500;

  // Mongoose duplicate-key error (e.g. username/email already taken)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({
      message: `${field.charAt(0).toUpperCase() + field.slice(1)} is already taken`,
    });
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ message: messages.join(", ") });
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({ message: "Invalid token" });
  }
  if (err.name === "TokenExpiredError") {
    return res.status(401).json({ message: "Token expired — please log in again" });
  }

  res.status(statusCode).json({
    message: err.message || "Internal Server Error",
    // Only expose stack traces in development
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

module.exports = { errorHandler };
