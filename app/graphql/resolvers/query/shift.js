import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const getShifts = async () => {
  try {
    const shifts = await prisma.shift.findMany();
    return shifts;
  } catch (error) {
    console.error("Error fetching shifts:", error);
    throw new Error("Failed to fetch shifts");
  }
};

export const getShiftById = async (id) => {
  try {
    const shift = await prisma.shift.findUnique({
      where: {
        id: parseInt(id),
      },
    });
    console.log(shift);
    return shift;
  } catch (error) {
    console.error("Error fetching shift by ID:", error);
    throw new Error("Failed to fetch shift");
  }
};

export const getAlternativeShifts = async (resourceId) => {
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

export const getShiftBreaks = async (shiftId) => {
  const breaks = await prisma.breakToShift.findMany({
    where: {
      shiftId: parseInt(shiftId),
    },
    include: {
      break: true,
    },
  });

  const shiftBreaks = breaks.map((item) => item.break);

  const sortedBreaks = shiftBreaks.sort((a, b) =>
    a.startTime.localeCompare(b.startTime)
  );

  return sortedBreaks;
};

export const getShiftsByBreakId = async (breakId) => {
  try {
    const shiftLinks = await prisma.breakToShift.findMany({
      where: {
        breakId: parseInt(breakId),
      },
      include: {
        shift: true,
      },
    });

    const shifts = shiftLinks.map((link) => link.shift);

    return shifts;
  } catch (error) {
    console.error("Error fetching shifts by break ID:", error);
    throw new Error("Failed to fetch shifts for the break");
  }
};
