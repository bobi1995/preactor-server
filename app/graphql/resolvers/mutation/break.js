import prisma from "../../../../prisma/prismaClient.js";

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

export const removeBreakFromShift = async ({ shiftId, breakId }) => {
  const record = await prisma.rEL_Break_Shift.findFirst({
    where: {
      shiftId: parseInt(shiftId),
      breakId: parseInt(breakId),
    },
  });

  if (record) {
    const deletedBreak = await prisma.rEL_Break_Shift.delete({
      where: {
        id: record.id,
      },
    });
    console.log("redeleted");
    return deletedBreak;
  }

  throw new Error("No record found for the specified shiftId and breakId.");
};
