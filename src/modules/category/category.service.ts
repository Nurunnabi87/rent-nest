import AppError from '../../errors/AppError';
import prisma from '../../shared/prisma';

const createCategory = async (payload: { name: string }) => {
  // If the name already exists, Prisma throws P2002 (unique constraint)
  // and the global error handler answers with 409 Conflict.
  return prisma.category.create({ data: payload });
};

const getAllCategories = async () => {
  return prisma.category.findMany({
    orderBy: { name: 'asc' },
    include: {
      // _count adds { properties: n } - how many listings use each category
      _count: { select: { properties: true } },
    },
  });
};

const updateCategory = async (id: string, payload: { name: string }) => {
  // update() throws P2025 (-> 404) if the id does not exist
  return prisma.category.update({ where: { id }, data: payload });
};

const deleteCategory = async (id: string) => {
  const propertyCount = await prisma.property.count({
    where: { categoryId: id },
  });

  if (propertyCount > 0) {
    throw new AppError(
      400,
      `Cannot delete: ${propertyCount} property listing(s) use this category`
    );
  }

  return prisma.category.delete({ where: { id } });
};

export const CategoryService = {
  createCategory,
  getAllCategories,
  updateCategory,
  deleteCategory,
};
