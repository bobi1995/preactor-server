import prisma from "../../../../prisma/prismaClient.js";
export const getRestrictions = async (resId) => {
  const restrictions = await prisma.restriction.findMany({
    where: {
      resourceId: resId,
    },
  });
  return restrictions;
};
