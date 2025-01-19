import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const getSchedules = async () => {
  const schedule = await prisma.weekSchedule.findMany();
  return schedule;
};

export const getScheduleById = async (id) => {
  const schedule = await prisma.weekSchedule.findUnique({
    where: {
      id,
    },
  });
  return schedule;
};
