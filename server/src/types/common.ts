export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }

  static badRequest(message: string) {
    return new ApiError(400, message);
  }

  static unauthorized(message = "Unauthorized") {
    return new ApiError(401, message);
  }

  static notFound(message = "Not found") {
    return new ApiError(404, message);
  }

  static tooMany(message = "Too many requests") {
    return new ApiError(429, message);
  }
}
