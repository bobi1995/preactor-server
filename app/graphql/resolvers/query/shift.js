import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const getShifts = async () => {
  const shifts = await prisma.shift.findMany();
  return shifts;
};

export const getShiftById = async (id) => {
  const shift = await prisma.shift.findUnique({
    where: {
      id,
    },
  });
  return shift;
};

export const getAlternateShifts = async (resourceId) => {
  const shifts = await prisma.alternativeShift.findMany({
    where: {
      resourceId,
    },
  });
  return shifts;
};

export const getBreaks = async () => {
  const breaks = await prisma.break.findMany();
  return breaks;
};

export const getShiftBreaks = async (shiftId) => {
  const breaks = await prisma.rEL_Break_Shift.findMany({
    where: {
      shiftId,
    },
    include: {
      break: true,
    },
  });

  const shiftBreaks = breaks.map((item) => item.break);
  const sortedBreaks = shiftBreaks.sort((a, b) => {
    const [aHour, aMinute] = a.startHour.split(":").map(Number);
    const [bHour, bMinute] = b.startHour.split(":").map(Number);

    return aHour !== bHour ? aHour - bHour : aMinute - bMinute;
  });
  return sortedBreaks;
};
