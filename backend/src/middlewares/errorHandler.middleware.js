import { ApiError } from "../utils/ApiError.js";

const errorHandler = (err, req, res, next) => {
  console.error("Error:", err); // Log the error for debugging

  // If the error is an instance of ApiError, send a structured response
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: err.success,
      message: err.message,
      errors: err.errors || [], // Send additional validation errors if available
    });
  }

  // Default to 500 Internal Server Error for unhandled exceptions
  return res.status(500).json({
    success: false,
    message: "Internal Server Error",
  });
};

export { errorHandler };
