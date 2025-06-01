import prisma from "../../../../prisma/prismaClient.js";

export const getResources = async () => {
  try {
    const resources = await prisma.resources.findMany();
    return resources;
  } catch (error) {
    console.error("Error fetching resources:", error);
    throw new Error("Failed to fetch resources");
  }
};

export const getResourcesByRegularShiftId = async (regularShiftId) => {
  const resource = await prisma.resources.findMany({
    where: {
      regularShiftId,
    },
  });
  return resource;
};

export const getResource = async (id) => {
  const resource = await prisma.resources.findUnique({
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
