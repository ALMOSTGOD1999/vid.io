class ApiError extends Error {
  constructor(
    statusCode,
    message = "Something went wrong",
    errors = [],
    stack = "",
  ) {
    super(message);
    this.statusCode = statusCode;
    this.message = message;
    this.errors = errors;
    this.data = null;
    this.success = false;

    // if (stack) {
    //     stack = this.stack
    // } else {
    //     Error.captureStackTrace(this, this.constructor)
    // }
  }
}

export { ApiError };
