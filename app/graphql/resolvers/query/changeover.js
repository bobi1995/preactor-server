import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const getChangeoverGroups = async () => {
  return await prisma.changeoverGroup.findMany();
};

export const getChangeoverGroup = async (id) => {
  return await prisma.changeoverGroup.findUnique({
    where: { id },
  });
};

export const getChangeoverTimes = async (changeoverGroupId) => {
  return await prisma.changeoverTime.findMany({
    where: { changeoverGroupId },
  });
};

export const getChangeoverDataMatrix = async (
  changeoverGroupId,
  attributeId
) => {
  return await prisma.changeoverData.findMany({
    where: {
      changeoverGroupId,
      attributeId,
    },
  });
};
