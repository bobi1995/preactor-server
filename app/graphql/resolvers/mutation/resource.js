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

export const assignScheduleToResource = async ({ resourceId, scheduleId }) => {
  const rId = parseInt(resourceId);
  const sId = scheduleId ? parseInt(scheduleId) : null; // Allow un-assigning by passing null

  if (isNaN(rId)) {
    throw new GraphQLError("Invalid Resource ID.", {
      extensions: { code: "BAD_USER_INPUT" },
    });
  }
  if (scheduleId && isNaN(sId)) {
    throw new GraphQLError("Invalid Schedule ID.", {
      extensions: { code: "BAD_USER_INPUT" },
    });
  }

  try {
    const updatedResource = await prisma.resource.update({
      where: {
        id: rId,
      },
      data: {
        scheduleId: sId,
      },
    });
    return updatedResource;
  } catch (error) {
    if (error.code === "P2025") {
      throw new GraphQLError("Resource not found.", {
        extensions: { code: "NOT_FOUND" },
      });
    }
    if (error.code === "P2003") {
      throw new GraphQLError("The specified Schedule does not exist.", {
        extensions: { code: "NOT_FOUND" },
      });
    }
    console.error("Error assigning schedule to resource:", error);
    throw new GraphQLError("Could not assign schedule to resource.", {
      extensions: { code: "INTERNAL_SERVER_ERROR" },
    });
  }
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

export const assignMassiveAlternative = async ({
  resourceIds,
  shiftId,
  startDate,
  endDate,
}) => {
  const alternativeShifts = await Promise.all(
    resourceIds.map(async (resourceId) => {
      // Check if there is already an alternative shift for the resource on the specified day
      const existingShift = await prisma.alternativeShift.findFirst({
        where: {
          resourceId,
          startDate,
          endDate,
        },
      });

      // Delete the existing shift if it exists
      if (existingShift) {
        console.log("Deleting existing");
        await prisma.alternativeShift.delete({
          where: {
            id: existingShift.id,
          },
        });
      }

      // Assign a new alternative shift
      return await prisma.alternativeShift.create({
        data: {
          shiftId,
          resourceId,
          startDate,
          endDate,
        },
      });
    })
  );
  return alternativeShifts[0];
};

export const assignAlternativeShiftToResource = async ({ input }) => {
  const { resourceId, shiftId, startDate, endDate } = input;

  // Basic validation
  if (!resourceId || !shiftId || !startDate || !endDate) {
    throw new GraphQLError(
      "All fields (resourceId, shiftId, startDate, endDate) are required.",
      {
        extensions: { code: "BAD_USER_INPUT" },
      }
    );
  }

  try {
    const newAlternativeShift = await prisma.alternativeShift.create({
      data: {
        resourceId: parseInt(resourceId),
        shiftId: parseInt(shiftId),
        startDate: new Date(startDate), // Ensure dates are converted to Date objects
        endDate: new Date(endDate),
      },
    });
    return newAlternativeShift;
  } catch (error) {
    // Handle cases where the resource or shift doesn't exist
    if (error.code === "P2003") {
      throw new GraphQLError(
        "The specified Resource or Shift does not exist.",
        {
          extensions: { code: "NOT_FOUND" },
        }
      );
    }
    console.error("Error creating alternative shift:", error);
    throw new GraphQLError("Failed to create alternative shift.", {
      extensions: { code: "INTERNAL_SERVER_ERROR" },
    });
  }
};

export const deleteAlternativeShift = async ({ id }) => {
  const alternativeShift = await prisma.alternativeShift.delete({
    where: {
      id,
    },
  });
  return alternativeShift;
};
