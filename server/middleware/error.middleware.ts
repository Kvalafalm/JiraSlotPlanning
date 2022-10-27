import { Request, Response } from 'express';
import ApiError from '../utils/exceptions/api_error';

const errorMiddleware = (err: any, req: Request, res: Response, next: any) => {
  const status: number = err.status as number;

  if (err instanceof ApiError) {
    return res
      .status(status)
      .json({ message: err.message, errors: err.errors });
  }
  console.log(err);
  return res.status(status).json({ message: 'Непредвиденная ошибка' });
};

export default errorMiddleware;
