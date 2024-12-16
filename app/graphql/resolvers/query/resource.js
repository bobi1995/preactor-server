import prisma from "../../../../prisma/prismaClient.js";

export const getResources = async () => {
  const resources = await prisma.resource.findMany();
  return resources;
};

export const getResource = async (id) => {
  const resource = await prisma.resource.findUnique({
    where: {
      id,
    },
  });
  return resource;
};

export const getReplacements = async (resId) => {
  const replacements = await prisma.replacement.findMany({
    where: {
      replacedBy: resId,
    },
  });
  return replacements;
};

export const getCanReplace = async (resId) => {
  const replacements = await prisma.replacement.findMany({
    where: {
      resourceId: resId,
    },
  });
  return replacements;
};
