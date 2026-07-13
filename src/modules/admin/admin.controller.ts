import { Request, Response } from 'express';
import sendResponse from '../../shared/sendResponse';
import { AdminService } from './admin.service';

const getAllUsers = async (req: Request, res: Response) => {
  const result = await AdminService.getAllUsers(req.query);

  sendResponse(res, {
    statusCode: 200,
    message: 'Users retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
};

const updateUserStatus = async (req: Request, res: Response) => {
  const result = await AdminService.updateUserStatus(
    req.params.id as string,
    req.body.status
  );

  sendResponse(res, {
    statusCode: 200,
    message: `User ${result.status === 'BANNED' ? 'banned' : 'unbanned'} successfully`,
    data: result,
  });
};

const getAllProperties = async (req: Request, res: Response) => {
  const result = await AdminService.getAllProperties(req.query);

  sendResponse(res, {
    statusCode: 200,
    message: 'All properties retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
};

const getAllRentals = async (req: Request, res: Response) => {
  const result = await AdminService.getAllRentals(req.query);

  sendResponse(res, {
    statusCode: 200,
    message: 'All rental requests retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
};

export const AdminController = {
  getAllUsers,
  updateUserStatus,
  getAllProperties,
  getAllRentals,
};
