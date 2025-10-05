import prisma from "../../../../prisma/prismaClient.js";

export const createSchedule = async ({ name }) => {
  const schedule = await prisma.weekSchedule.create({
    data: {
      name,
    },
  });
  return schedule;
};

export const updateSchedule = async ({ id, input }) => {
  const schedule = await prisma.weekSchedule.update({
    where: { id: parseInt(id) },
    data: {
      ...input,
    },
  });
  return schedule;
};

export const deleteSchedule = async ({ id }) => {
  // Remove schedules assigned to resources as alternative or as schedule
  try {
    await prisma.resource.updateMany({
      where: {
        OR: [{ scheduleId: id }],
      },
      data: {
        scheduleId: null,
      },
    });

    // Delete all alternative shifts with the schedule ID
    await prisma.alternativeShift.deleteMany({
      where: { shiftId: id },
    });
  } catch (err) {
    console.log(err);
  }

  const schedule = await prisma.weekSchedule.delete({
    where: { id },
  });
  return schedule;
};
