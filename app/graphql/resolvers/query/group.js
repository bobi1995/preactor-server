import prisma from "../../../../prisma/prismaClient.js";

export const getGroups = async () => {
  const groups = await prisma.group.findMany({
    include: {
      resources: {
        include: {
          resource: true,
        },
      },
    },
  });

  return groups;
};

export const getGroupByResId = async (resId) => {
  const groups = await prisma.group.findMany({
    where: {
      resources: {
        some: {
          id: resId,
        },
      },
    },
  });

  return groups;
};
