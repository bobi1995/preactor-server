import prisma from "../../../../prisma/prismaClient.js";

export const getSchedules = async () => {
  const schedules = await prisma.schedule.findMany({
    orderBy: {
      name: "asc",
    },
  });
  return schedules;
};

export const getScheduleById = async (id) => {
  const scheduleId = parseInt(id);
  if (isNaN(scheduleId)) return null;

  const schedule = await prisma.schedule.findUnique({
    where: {
      id: scheduleId,
    },
  });
  return schedule;
};
