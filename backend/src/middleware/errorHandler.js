function errorHandler(err, req, res, _next) {
  // Multer file size limit error
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      error: 'This file is over 20 MB. Try a smaller PDF.',
    });
  }

  // Multer unexpected field error
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      error: "This file isn't a PDF. Please upload a PDF document.",
    });
  }

  // Log the error for debugging (no stack traces to client)
  console.error('Unhandled error:', err.message);

  return res.status(500).json({
    error: 'Something went wrong. Please try again.',
  });
}

module.exports = errorHandler;
