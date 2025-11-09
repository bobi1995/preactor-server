import prisma from "../../../../prisma/prismaClient.js";

/**
 * @deprecated Use getResourceGroups from resourceGroup.js instead
 * This file is kept for backwards compatibility but uses correct Prisma model names
 */
export const getGroups = async () => {
  const groups = await prisma.resourceGroup.findMany({
    include: {
      resourceLinks: {
        include: {
          resource: true,
        },
      },
      orders: true,
    },
  });

  return groups;
};

/**
 * @deprecated Use getResourceGroup from resourceGroup.js instead
 * This file is kept for backwards compatibility but uses correct Prisma model names
 */
export const getGroupByResId = async (resId) => {
  const groups = await prisma.resourceGroup.findMany({
    where: {
      resourceLinks: {
        some: {
          resourceId: resId,
        },
      },
    },
  });

  return groups;
};
