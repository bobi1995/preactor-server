import prisma from "../../../../prisma/prismaClient.js";

export const createShift = async ({ input }) => {
  const shift = await prisma.shifts.create({
    data: {
      name: input.name,
      startHour: input.startHour,
      endHour: input.endHour,
    },
  });
  return shift;
};
