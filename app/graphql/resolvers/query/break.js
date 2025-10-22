import prisma from "../../../../prisma/prismaClient.js";

export const getBreaks = async () => {
  const breaks = await prisma.break.findMany({
    orderBy: {
      startTime: "asc",
    },
  });
  return breaks;
};
