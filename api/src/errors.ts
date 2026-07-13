/**
 * Application error type carrying an HTTP status code and a machine-readable
 * error code. The Fastify error handler (see app.ts) renders these as a
 * consistent JSON envelope.
 */
export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;

  constructor(statusCode: number, code: string, message: string) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

export const badRequest = (message: string, code = "bad_request") =>
  new AppError(400, code, message);

export const unauthorized = (
  message = "Authentication required",
  code = "unauthorized",
) => new AppError(401, code, message);

export const forbidden = (message: string, code = "forbidden") =>
  new AppError(403, code, message);

export const notFound = (message = "Not found", code = "not_found") =>
  new AppError(404, code, message);

export const conflict = (message: string, code = "conflict") =>
  new AppError(409, code, message);
