import { Request, Response, NextFunction } from 'express';
import { logger } from '@/shared/utils/logger';
import { AppError } from '@/shared/utils/errors';

export function errorHandler(
  error: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (res.headersSent) {
    return next(error);
  }

  // Log error
  logger.error({
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userId: (req as any).user?.id,
  });

  // Handle known errors
  if (error instanceof AppError) {
    const isProduction = process.env.NODE_ENV === 'production';
    
    res.status(error.statusCode).json({
      error: {
        message: error.message,
        code: error.code,
        // Never expose stack traces in production
        ...(isProduction ? {} : { stack: error.stack }),
      },
    });
    return;
  }

  // Handle Prisma errors
  if (error.name === 'PrismaClientKnownRequestError') {
    const prismaError = error as any;
    if (prismaError.code === 'P2002') {
      res.status(409).json({
        error: {
          message: 'A record with this value already exists',
          code: 'DUPLICATE_ENTRY',
        },
      });
      return;
    }
  }

  // Handle validation errors
  if (error.name === 'ValidationError') {
    res.status(400).json({
      error: {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: (error as any).errors,
      },
    });
    return;
  }

  // Default error response
  const isProduction = process.env.NODE_ENV === 'production';
  
  res.status(500).json({
    error: {
      message: isProduction 
        ? 'Internal server error' 
        : error.message,
      code: 'INTERNAL_ERROR',
      // Never expose stack traces in production
      ...(isProduction ? {} : { stack: error.stack }),
    },
  });
}