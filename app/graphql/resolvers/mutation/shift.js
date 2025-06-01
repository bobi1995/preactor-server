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

export const createBreak = async ({ input }) => {
  const newBreak = await prisma.breaks.create({
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
      shiftId: parseInt(shiftId),
      breakId: parseInt(breakId),
    },
  });
  return shiftBreak;
};

export const deleteBreak = async ({ id }) => {
  await prisma.rEL_Break_Shift.deleteMany({
    where: {
      breakId: id,
    },
  });
  const deletedBreak = await prisma.breaks.delete({
    where: {
      id,
    },
  });
  return deletedBreak;
};

export const deleteBreakFromShift = async ({ shiftId, breakId }) => {
  const record = await prisma.rEL_Break_Shift.findFirst({
    where: {
      shiftId,
      breakId,
    },
  });

  // If the record exists, delete it
  if (record) {
    const deletedBreak = await prisma.rEL_Break_Shift.delete({
      where: {
        id: record.id, // Use the unique `id` field
      },
    });
    return deletedBreak;
  }

  throw new Error("No record found for the specified shiftId and breakId.");
};
