function notFound(req, res, next) {
  res.status(404).json({ error: `Not found: ${req.originalUrl}` });
}

function errorHandler(err, req, res, next) {
  console.error(err);
  const status = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  res.status(status).json({ error: err.message || "Server error" });
}

module.exports = { notFound, errorHandler };
