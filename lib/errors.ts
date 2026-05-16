export class DomainError extends Error {
  constructor(
    message: string,
    public readonly statusCode = 400,
  ) {
    super(message);
    this.name = "DomainError";
  }
}

export class AuthorizationError extends DomainError {
  constructor(message = "You are not allowed to perform this action.") {
    super(message, 403);
    this.name = "AuthorizationError";
  }
}

export class NotFoundError extends DomainError {
  constructor(message = "Resource not found.") {
    super(message, 404);
    this.name = "NotFoundError";
  }
}
