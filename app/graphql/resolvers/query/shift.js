import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const getShifts = async () => {
  const shifts = await prisma.shifts.findMany();
  return shifts;
};

export const getShiftById = async (id) => {
  try {
    const shift = await prisma.shifts.findUnique({
      where: {
        id: parseInt(id),
      },
    });
    return shift;
  } catch (error) {
    console.error("Error fetching shift by ID:", error);
    throw new Error("Failed to fetch shift");
  }

  return shift;
};

export const getAlternateShifts = async (resourceId) => {
  const shifts = await prisma.alternativeShifts.findMany({
    where: {
      resourceId,
      // endDate: {
      //   gte: Math.floor(
      //     new Date(new Date().setDate(new Date().getDate() - 1)).getTime() /
      //       1000
      //   ).toString(),
      // },
    },
    include: {
      shift: true,
    },
  });
  return shifts.length > 0 ? shifts : [];
};

export const getBreaks = async () => {
  const breaks = await prisma.breaks.findMany();
  return breaks;
};

export const getShiftBreaks = async (shiftId) => {
  const breaks = await prisma.rEL_Break_Shift.findMany({
    where: {
      shiftId,
    },
    include: {
      break: true, // Corrected the field name to match the schema
    },
  });

  const shiftBreaks = breaks.map((item) => item.break); // Updated to match the corrected field name
  const sortedBreaks = shiftBreaks.sort((a, b) => {
    const [aHour, aMinute] = a.startHour.split(":").map(Number);
    const [bHour, bMinute] = b.startHour.split(":").map(Number);

    return aHour !== bHour ? aHour - bHour : aMinute - bMinute;
  });
  return sortedBreaks;
};
