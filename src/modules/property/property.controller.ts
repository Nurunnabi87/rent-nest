import { Request, Response } from 'express';
import sendResponse from '../../shared/sendResponse';
import { PropertyService } from './property.service';

// ---------- PUBLIC ----------

const getAllProperties = async (req: Request, res: Response) => {
  const result = await PropertyService.getAllProperties(req.query);

  sendResponse(res, {
    statusCode: 200,
    message: 'Properties retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
};

const getPropertyById = async (req: Request, res: Response) => {
  const result = await PropertyService.getPropertyById(
    req.params.id as string
  );

  sendResponse(res, {
    statusCode: 200,
    message: 'Property details retrieved successfully',
    data: result,
  });
};

// ---------- LANDLORD ----------

const createProperty = async (req: Request, res: Response) => {
  const result = await PropertyService.createProperty(
    req.user!.userId,
    req.body
  );

  sendResponse(res, {
    statusCode: 201,
    message: 'Property listed successfully',
    data: result,
  });
};

const getMyProperties = async (req: Request, res: Response) => {
  const result = await PropertyService.getMyProperties(req.user!.userId);

  sendResponse(res, {
    statusCode: 200,
    message: 'Your properties retrieved successfully',
    data: result,
  });
};

const updateProperty = async (req: Request, res: Response) => {
  const result = await PropertyService.updateProperty(
    req.params.id as string,
    req.user!.userId,
    req.body
  );

  sendResponse(res, {
    statusCode: 200,
    message: 'Property updated successfully',
    data: result,
  });
};

const deleteProperty = async (req: Request, res: Response) => {
  await PropertyService.deleteProperty(
    req.params.id as string,
    req.user!.userId
  );

  sendResponse(res, {
    statusCode: 200,
    message: 'Property removed successfully',
  });
};

export const PropertyController = {
  getAllProperties,
  getPropertyById,
  createProperty,
  getMyProperties,
  updateProperty,
  deleteProperty,
};
