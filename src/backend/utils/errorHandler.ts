import { Response } from 'express';

export class APIError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public source?: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export const handleError = (error: Error | APIError, res: Response) => {
  if (error instanceof APIError) {
    return res.status(error.statusCode).json({
      error: error.message,
      source: error.source,
    });
  }

  console.error('Unexpected error:', error);
  return res.status(500).json({
    error: 'An unexpected error occurred',
  });
};