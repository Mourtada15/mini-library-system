// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
   
  console.error(err);

  const status = err.status || 500;
  const response = {
    message: err.message || 'Internal Server Error',
  };

  if (process.env.NODE_ENV !== 'production' && err.stack) {
    response.stack = err.stack;
  }

  res.status(status).json(response);
}

module.exports = { errorHandler };

