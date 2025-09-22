import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const getBreaks = async () => {
  const breaks = await prisma.break.findMany();
  return breaks;
};
