import { Request, Response } from 'express';
import sendResponse from '../../shared/sendResponse';
import { CategoryService } from './category.service';

const createCategory = async (req: Request, res: Response) => {
  const result = await CategoryService.createCategory(req.body);

  sendResponse(res, {
    statusCode: 201,
    message: 'Category created successfully',
    data: result,
  });
};

const getAllCategories = async (req: Request, res: Response) => {
  const result = await CategoryService.getAllCategories();

  sendResponse(res, {
    statusCode: 200,
    message: 'Categories retrieved successfully',
    data: result,
  });
};

const updateCategory = async (req: Request, res: Response) => {
  const result = await CategoryService.updateCategory(
    req.params.id as string,
    req.body
  );

  sendResponse(res, {
    statusCode: 200,
    message: 'Category updated successfully',
    data: result,
  });
};

const deleteCategory = async (req: Request, res: Response) => {
  await CategoryService.deleteCategory(req.params.id as string);

  sendResponse(res, {
    statusCode: 200,
    message: 'Category deleted successfully',
  });
};

export const CategoryController = {
  createCategory,
  getAllCategories,
  updateCategory,
  deleteCategory,
};
