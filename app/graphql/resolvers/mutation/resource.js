import prisma from "../../../../prisma/prismaClient.js";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const createResource = async ({ input }) => {
  const resource = await prisma.resource.create({
    data: {
      name: input.name,
      description: input.description,
      color: input.color,
    },
  });
  return resource;
};

export const uploadPicture = async ({ picPath, id }) => {
  const existingResource = await prisma.resource.findUnique({
    where: { id },
    select: { picture: true },
  });

  if (existingResource?.picture) {
    try {
      await fs.unlink(
        path.join(__dirname, "../../../../public", existingResource.picture)
      );
    } catch (error) {
      console.log("Error deleting file", error);
    }
  }

  const resource = await prisma.resource.update({
    where: {
      id,
    },
    data: {
      picture: picPath,
    },
  });
  return resource;
};

export const assignShiftToResource = async ({ resourceId, shiftId }) => {
  const resource = await prisma.resource.update({
    where: {
      id: resourceId,
    },
    data: {
      regularShiftId: shiftId,
    },
  });
  return resource;
};

export const assignAlternativeShift = async ({
  resourceId,
  shiftId,
  startDate,
  endDate,
}) => {
  const alternativeShift = await prisma.alternativeShift.create({
    data: {
      shiftId,
      resourceId,
      startDate,
      endDate,
    },
  });
  return alternativeShift;
};
