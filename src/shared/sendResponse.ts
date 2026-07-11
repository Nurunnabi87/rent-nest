import { Response } from 'express';

type TMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type TResponseData<T> = {
  statusCode: number;
  message: string;
  meta?: TMeta;
  data?: T;
};

// Every successful response in the API goes through this helper,
// so success responses are as consistent as error responses.
const sendResponse = <T>(res: Response, payload: TResponseData<T>) => {
  res.status(payload.statusCode).json({
    success: true,
    message: payload.message,
    ...(payload.meta && { meta: payload.meta }),
    data: payload.data ?? null,
  });
};

export default sendResponse;
