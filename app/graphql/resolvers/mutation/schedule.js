import prisma from "../../../../prisma/prismaClient.js";

export const createSchedule = async ({ name }) => {
  const shift = await prisma.weekSchedule.create({
    data: {
      name,
    },
  });
  return shift;
};

export const updateSchedule = async ({ id, input }) => {
  const shift = await prisma.weekSchedule.update({
    where: { id },
    data: {
      ...input,
    },
  });
  return shift;
};
