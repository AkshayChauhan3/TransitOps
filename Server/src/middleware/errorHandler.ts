import { Request, Response, NextFunction } from 'express';
import pino from 'pino';

const logger = pino();

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error({ err, path: req.path, method: req.method }, 'Unhandled Error');

  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let code = err.code || 'INTERNAL_ERROR';

  if (err.name === 'PrismaClientValidationError') {
    statusCode = 400;
    message = 'Invalid input format';
    code = 'BAD_REQUEST';
  }

  res.status(statusCode).json({
    error: {
      code,
      message
    }
  });
};
