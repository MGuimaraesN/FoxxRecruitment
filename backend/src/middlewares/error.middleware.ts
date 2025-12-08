import type { Request, Response, NextFunction } from 'express';

export function globalErrorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error('🔥 Erro Global:', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Erro interno do servidor';

  // Se for erro do Zod (validação)
  if (err.name === 'ZodError') {
     return res.status(400).json({
      error: 'Erro de validação',
      details: err.issues
    });
  }

  res.status(statusCode).json({
    error: message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
}
