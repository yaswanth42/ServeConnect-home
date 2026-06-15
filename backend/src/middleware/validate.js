const AppError = require('../utils/appError');

const validate = (schema) => (req, res, next) => {
  try {
    schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    next();
  } catch (error) {
    const errorMessages = error.errors.map((err) => `${err.path.join('.')}: ${err.message}`).join(', ');
    next(new AppError(`Validation error: ${errorMessages}`, 400));
  }
};

module.exports = validate;
