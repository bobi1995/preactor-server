import { GraphQLError } from "graphql";
import prisma from "../../../../prisma/prismaClient.js";

export const createSchedule = async ({ input }) => {
  const { name, ...dayIds } = input;
  if (!name || name.trim() === "") {
    throw new GraphQLError("Schedule name cannot be empty.", {
      extensions: { code: "BAD_USER_INPUT" },
    });
  }

  // Use reduce to transform the dayIds object into the format Prisma expects
  const relations = Object.entries(dayIds).reduce((acc, [key, value]) => {
    // For each entry like ["mondayId", "1"]
    if (value) {
      // Only process if an ID was provided
      const relationName = key.replace("Id", ""); // "mondayId" -> "monday"
      const shiftId = parseInt(value);

      if (!isNaN(shiftId)) {
        // Add the { connect: { id: ... } } object to our accumulator
        acc[relationName] = { connect: { id: shiftId } };
      }
    }
    return acc; // Return the accumulator for the next iteration
  }, {});

  try {
    const schedule = await prisma.schedule.create({
      data: {
        name,
        ...relations, // Spread the transformed relations into the data object
      },
    });
    return schedule;
  } catch (error) {
    if (error.code === "P2002" && error.meta?.modelName === "Schedule") {
      throw new GraphQLError(
        `A schedule with the name "${name}" already exists.`,
        {
          extensions: { code: "SCHEDULE_NAME_TAKEN" },
        }
      );
    }
    console.error("Error creating schedule:", error);
    throw new GraphQLError("Failed to create schedule.", {
      extensions: { code: "INTERNAL_SERVER_ERROR" },
    });
  }
};

export const updateSchedule = async ({ id, input }) => {
  const scheduleId = parseInt(id);
  if (isNaN(scheduleId)) {
    throw new GraphQLError("Invalid Schedule ID.", {
      extensions: { code: "BAD_USER_INPUT" },
    });
  }

  const dataToUpdate = Object.entries(input).reduce((acc, [key, value]) => {
    if (key.endsWith("Id")) {
      if (value === null || value === "") {
        acc[key] = null;
      } else {
        const shiftId = parseInt(value);
        if (!isNaN(shiftId)) {
          acc[key] = shiftId;
        }
      }
    } else {
      acc[key] = value;
    }
    return acc;
  }, {});

  if (Object.keys(dataToUpdate).length === 0) {
    return prisma.schedule.findUnique({ where: { id: scheduleId } });
  }

  try {
    const schedule = await prisma.schedule.update({
      where: { id: scheduleId },
      data: dataToUpdate,
    });
    return schedule;
  } catch (error) {
    if (error.code === "P2025") {
      throw new GraphQLError("Schedule not found.", {
        extensions: { code: "NOT_FOUND" },
      });
    }
    if (error.code === "P2002" && error.meta?.modelName === "Schedule") {
      throw new GraphQLError(
        `A schedule with the name "${input.name}" already exists.`,
        {
          extensions: { code: "SCHEDULE_NAME_TAKEN" },
        }
      );
    }
    console.error("Error updating schedule:", error);
    throw new GraphQLError("Failed to update schedule.", {
      extensions: { code: "INTERNAL_SERVER_ERROR" },
    });
  }
};

export const deleteSchedule = async ({ id }) => {
  const scheduleId = parseInt(id);
  if (isNaN(scheduleId)) {
    throw new GraphQLError("Invalid Schedule ID.", {
      extensions: { code: "BAD_USER_INPUT" },
    });
  }

  try {
    const resourceCount = await prisma.resource.count({
      where: { scheduleId: scheduleId },
    });

    if (resourceCount > 0) {
      throw new GraphQLError(
        `Cannot delete schedule. It is currently assigned to ${resourceCount} resource(s). Please unassign it first.`,
        { extensions: { code: "SCHEDULE_IN_USE" } }
      );
    }

    await prisma.schedule.delete({
      where: { id: scheduleId },
    });

    return {
      success: true,
      message: "Schedule deleted successfully.",
    };
  } catch (error) {
    console.log(error);
    if (error instanceof GraphQLError) {
      throw error;
    }
    if (error.code === "P2025") {
      throw new GraphQLError("Schedule not found.", {
        extensions: { code: "NOT_FOUND" },
      });
    }
    console.error("Error deleting schedule:", error);
    throw new GraphQLError("Failed to delete schedule.", {
      extensions: { code: "INTERNAL_SERVER_ERROR" },
    });
  }
};
