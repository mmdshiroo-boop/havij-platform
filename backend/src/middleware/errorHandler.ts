// backend/src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from "express";

export class AppError extends Error {
  statusCode: number;
  errorCode: string;

  constructor(
    message: string,
    statusCode: number,
    errorCode: string = "ERROR",
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errorCode: err.errorCode,
    });
  }

  console.error("UNEXPECTED ERROR:", err);
  return res.status(500).json({
    success: false,
    message: "خطای داخلی سرور",
    errorCode: "INTERNAL_ERROR",
  });
};
