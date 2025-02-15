import prisma from "../../../../prisma/prismaClient.js";

export const getResources = async () => {
  const resources = await prisma.resource.findMany();
  return resources;
};

export const getResourcesByRegularShiftId = async (regularShiftId) => {
  const resource = await prisma.resource.findMany({
    where: {
      regularShiftId,
    },
  });
  return resource;
};

export const getResource = async (id) => {
  const resource = await prisma.resource.findUnique({
    where: {
      id,
    },
  });
  return resource;
};

export const getResourcesByGroupId = async (groupId) => {
  const relations = await prisma.rEL_group_resource.findMany({
    where: {
      groupId,
    },
    include: {
      resource: true,
    },
  });
  const resources = relations.map((relation) => relation.resource);
  return resources;
};
