import prisma from "../../../../prisma/prismaClient.js";

export const getGroups = async () => {
  const group = await prisma.group.findMany();
  return group;
};
