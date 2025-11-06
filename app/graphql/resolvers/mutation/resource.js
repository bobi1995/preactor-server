import prisma from "../../../../prisma/prismaClient.js";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { GraphQLError } from "graphql";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const mapInputToData = (input) => {
  const { schedule_id, changeover_group_id, ...rest } = input;

  const data = {
    ...rest,
  };

  if (schedule_id !== undefined) {
    data.scheduleId = schedule_id ? parseInt(schedule_id) : null;
  }
  if (changeover_group_id !== undefined) {
    data.changeoverGroupId = changeover_group_id
      ? parseInt(changeover_group_id)
      : null;
  }

  if (input.accumulative !== undefined) {
    data.accumulative = Boolean(input.accumulative);
  }

  return data;
};

export const createResource = async ({ input }) => {
  try {
    const data = mapInputToData(input);
    const newResource = await prisma.resource.create({
      data: data,
    });
    return newResource;
  } catch (error) {
    console.error("Error creating resource:", error);
    if (error.code === "P2002") {
      // Unique constraint violation (e.g., external_code)
      throw new GraphQLError(
        "A resource with this external code already exists.",
        {
          extensions: { code: "BAD_USER_INPUT" },
        }
      );
    }
    throw new GraphQLError("Failed to create resource.", {
      extensions: { code: "INTERNAL_SERVER_ERROR" },
    });
  }
};

export const updateResource = async (_, { input }) => {
  try {
    const { id, ...updateData } = input;
    const data = mapInputToData(updateData);

    const updatedResource = await prisma.resource.update({
      where: { id: parseInt(id) },
      data: data,
    });
    return updatedResource;
  } catch (error) {
    console.error("Error updating resource:", error);
    if (error.code === "P2025") {
      // Record to update not found
      throw new GraphQLError("Resource not found.", {
        extensions: { code: "NOT_FOUND" },
      });
    }
    if (error.code === "P2002") {
      throw new GraphQLError(
        "A resource with this external code already exists.",
        {
          extensions: { code: "BAD_USER_INPUT" },
        }
      );
    }
    throw new GraphQLError("Failed to update resource.", {
      extensions: { code: "INTERNAL_SERVER_ERROR" },
    });
  }
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

export const deleteResource = async (_, { id }) => {
  const resourceId = parseInt(id);
  try {
    // 1. Check if the resource exists
    const resourceToDelete = await prisma.resource.findUnique({
      where: { id: resourceId },
      select: { id: true, picture: true },
    });

    if (!resourceToDelete) {
      throw new GraphQLError("Resource not found.", {
        extensions: { code: "NOT_FOUND" },
      });
    }

    // 2. Perform cascading cleanup within a transaction
    await prisma.$transaction(async (tx) => {
      // 2a. Delete related AlternativeShifts
      await tx.alternativeShift.deleteMany({
        where: { resourceId: resourceId },
      });

      // 2b. Delete links in REL_Resource_group
      await tx.resourceToGroup.deleteMany({
        where: { resourceId: resourceId },
      });

      // 2c. Check for related Orders.
      const relatedOrders = await tx.order.findFirst({
        where: { resourceId: resourceId },
      });
      if (relatedOrders) {
        throw new GraphQLError(
          "Cannot delete resource. It is still linked to one or more orders.",
          { extensions: { code: "BAD_REQUEST" } }
        );
      }

      // 2d. Finally, delete the resource itself
      await tx.resource.delete({
        where: { id: resourceId },
      });
    });

    // 3. Delete the associated picture file (if it exists)
    if (resourceToDelete.picture) {
      try {
        await fs.unlink(
          path.join(__dirname, "../../../../public", resourceToDelete.picture)
        );
      } catch (fileError) {
        console.warn(
          `Failed to delete picture file ${resourceToDelete.picture} for deleted resource ${resourceId}:`,
          fileError
        );
      }
    }

    return {
      message: "Resource deleted successfully.",
      success: true,
    };
  } catch (error) {
    if (error.extensions?.code) {
      throw error;
    }
    console.error(`Error deleting resource ${id}:`, error);
    throw new GraphQLError("Failed to delete resource.", {
      extensions: { code: "INTERNAL_SERVER_ERROR" },
    });
  }
};
