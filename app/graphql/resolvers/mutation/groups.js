import prisma from "../../../../prisma/prismaClient.js";

export const createGroup = async ({ name, description }) => {
  const group = await prisma.group.create({
    data: {
      name,
      description,
    },
  });
  return group;
};

export const addResourceToGroup = async ({ groupId, resourceIds }) => {
  const promises = resourceIds.map((resourceId) =>
    prisma.rEL_group_resource.create({
      data: {
        groupId,
        resourceId,
      },
    })
  );
  await Promise.all(promises);
  return groupId;
};

export const removeResourceFromGroup = async ({ groupId, resourceId }) => {
  await prisma.rEL_group_resource.deleteMany({
    where: {
      groupId,
      resourceId,
    },
  });
  return groupId;
};
