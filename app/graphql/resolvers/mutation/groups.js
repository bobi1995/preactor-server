import prisma from "../../../../prisma/prismaClient.js";

/**
 * @deprecated Use createResourceGroup from resourceGroup.js instead
 * This file is kept for backwards compatibility but uses correct Prisma model names
 */
export const createGroup = async ({ name, description }) => {
  const group = await prisma.resourceGroup.create({
    data: {
      name,
      description,
    },
  });
  return group;
};

/**
 * @deprecated Use addResourceToGroup from resourceGroup.js instead
 * This file is kept for backwards compatibility but uses correct Prisma model names
 */
export const addResourceToGroup = async ({ groupId, resourceIds }) => {
  const promises = resourceIds.map((resourceId) =>
    prisma.resourceToGroup.create({
      data: {
        resourceGroupId: groupId,
        resourceId,
      },
    })
  );
  await Promise.all(promises);
  return groupId;
};

/**
 * @deprecated Use removeResourceFromGroup from resourceGroup.js instead
 * This file is kept for backwards compatibility but uses correct Prisma model names
 */
export const removeResourceFromGroup = async ({ groupId, resourceId }) => {
  await prisma.resourceToGroup.deleteMany({
    where: {
      resourceGroupId: groupId,
      resourceId,
    },
  });
  return groupId;
};
