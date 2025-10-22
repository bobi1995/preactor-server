import prisma from "../../../../prisma/prismaClient.js";
import { GraphQLError } from "graphql";

export const createShift = async ({ input }) => {
  try {
    const shift = await prisma.shift.create({
      data: {
        name: input.name,
        startHour: input.startHour,
        endHour: input.endHour,
      },
    });
    return shift;
  } catch (error) {
    if (error.code === "P2002" && error.meta?.modelName === "Shift") {
      throw new GraphQLError(
        `A shift with the name "${input.name}" already exists.`,
        {
          extensions: { code: "SHIFT_NAME_TAKEN" },
        }
      );
    }
    throw new GraphQLError("Failed to create shift.", {
      extensions: { code: "INTERNAL_SERVER_ERROR" },
    });
  }
};

export const updateShift = async ({ id, input }) => {
  if (!id) {
    throw new Error("ID_NOT_PROVIDED");
  }
  try {
    const updatedShift = await prisma.shift.update({
      where: { id: parseInt(id) },
      data: {
        name: input.name,
        startHour: input.startHour,
        endHour: input.endHour,
      },
    });
    return updatedShift;
  } catch (error) {
    if (error.code === "P2002" && error.meta?.modelName === "Shift") {
      throw new GraphQLError(
        `A shift with the name "${input.name}" already exists.`,
        {
          extensions: { code: "SHIFT_NAME_TAKEN" },
        }
      );
    }
    throw new GraphQLError("Failed to update shift.", {
      extensions: { code: "INTERNAL_SERVER_ERROR" },
    });
  }
};

export const deleteShift = async ({ id }) => {
  if (!id) {
    throw new GraphQLError("Shift ID must be provided.", {
      extensions: { code: "BAD_USER_INPUT" },
    });
  }

  const shiftId = parseInt(id);
  if (isNaN(shiftId)) {
    throw new GraphQLError("Invalid Shift ID format.", {
      extensions: { code: "BAD_USER_INPUT" },
    });
  }

  try {
    // --- Step 1: Perform pre-checks to see if the shift is in use ---
    // We run these checks concurrently in a single transaction for efficiency.
    const [scheduleCount, alternativeShiftCount] = await prisma.$transaction([
      prisma.schedule.count({
        where: {
          OR: [
            { mondayId: shiftId },
            { tuesdayId: shiftId },
            { wednesdayId: shiftId },
            { thursdayId: shiftId },
            { fridayId: shiftId },
            { saturdayId: shiftId },
            { sundayId: shiftId },
          ],
        },
      }),
      prisma.alternativeShift.count({ where: { shiftId: shiftId } }),
    ]);

    if (scheduleCount > 0) {
      throw new GraphQLError(
        "Cannot delete shift. It is used in one or more weekly schedules.",
        {
          extensions: { code: "SHIFT_IN_USE_BY_SCHEDULE" },
        }
      );
    }

    if (alternativeShiftCount > 0) {
      throw new GraphQLError(
        "Cannot delete shift. It is used in one or more alternative shifts.",
        {
          extensions: { code: "SHIFT_IN_USE_BY_ALTERNATIVE" },
        }
      );
    }

    // --- Step 3: If all checks pass, proceed with transactional deletion ---
    // This ensures both operations (deleting links, then the shift) succeed or fail together.
    await prisma.$transaction(async (tx) => {
      // First, remove all links from the join table for breaks.
      await tx.breakToShift.deleteMany({
        where: { shiftId: shiftId },
      });

      // Then, delete the shift itself.
      const shift = await tx.shift.delete({
        where: { id: shiftId },
      });

      return shift;
    });

    return {
      message: "Shift deleted successfully.",
      success: true,
    };
  } catch (error) {
    // If the error is one of our custom GraphQLErrors, re-throw it.
    if (error instanceof GraphQLError) {
      throw error;
    }

    // Handle the case where the shift to be deleted doesn't exist.
    if (error.code === "P2025") {
      throw new GraphQLError("Shift not found.", {
        extensions: { code: "NOT_FOUND" },
      });
    }

    // For any other unexpected errors.
    console.error("Error deleting shift:", error);
    throw new GraphQLError(
      "An unexpected error occurred while trying to delete the shift.",
      {
        extensions: { code: "INTERNAL_SERVER_ERROR" },
      }
    );
  }
};
