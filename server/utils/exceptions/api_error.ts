class ApiError extends Error {
  status;
  errors;
  code;

  constructor(status: number, code: number, message: string, errors = []) {
    super(message);
    this.status = status;
    this.code = code;
    this.errors = errors;
  }

  static UnauthorizedError() {
    return new ApiError(401, 401, 'Пользователь не авторизован');
  }

  static ExternalConnectionError() {
    return new ApiError(401, 401, 'Error connection to external service');
  }
  
  static BadRequest(message: string, errors = []) {
    return new ApiError(400, 400, message, errors);
  }
}
export default ApiError;
