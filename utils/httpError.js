class HttpError extends Error {
  constructor(statusCode, message, payload = null) {
    super(message);
    this.name = 'HttpError';
    this.statusCode = statusCode;
    this.payload = payload;
  }
}

const createHttpError = (statusCode, message, payload) =>
  new HttpError(statusCode, message, payload);

module.exports = {
  HttpError,
  createHttpError,
  badRequest: (message, payload) => createHttpError(400, message, payload),
  unauthorized: (message = 'Not authorized', payload) => createHttpError(401, message, payload),
  forbidden: (message = 'Access denied', payload) => createHttpError(403, message, payload),
  notFound: (message = 'Not found', payload) => createHttpError(404, message, payload),
};
