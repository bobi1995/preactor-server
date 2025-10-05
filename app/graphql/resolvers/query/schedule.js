import prisma from "../../../../prisma/prismaClient.js";

export const getSchedules = async () => {
  const schedule = await prisma.weekSchedule.findMany();
  return schedule;
};

export const getScheduleById = async (id) => {
  const schedule = await prisma.weekSchedule.findUnique({
    where: {
      id: parseInt(id),
    },
  });
  return schedule;
};
