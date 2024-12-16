import prisma from "../../../../prisma/prismaClient.js";

export const createShift = async ({ input }) => {
  const shift = await prisma.shift.create({
    data: {
      name: input.name,
      startHour: input.startHour,
      endHour: input.endHour,
    },
  });
  return shift;
};

export const createBreak = async ({ input }) => {
  const newBreak = await prisma.break.create({
    data: {
      name: input.name,
      startHour: input.startHour,
      endHour: input.endHour,
    },
  });
  return newBreak;
};

export const assignBreakToShift = async ({ shiftId, breakId }) => {
  const shiftBreak = await prisma.rEL_Break_Shift.create({
    data: {
      shiftId,
      breakId,
    },
  });
  return shiftBreak;
};
