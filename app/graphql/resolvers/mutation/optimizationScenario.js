import prisma from "../../../../prisma/prismaClient.js";
import { GraphQLError } from "graphql";

const handleDefaultFlag = async (tx, isDefault, excludeId = null) => {
  if (isDefault) {
    await tx.optimizationScenario.updateMany({
      where: {
        id: { not: excludeId },
      },
      data: { isDefault: false },
    });
  }
};

export const createOptimizationScenario = async ({ input }) => {
  const { isDefault, ...rest } = input;

  try {
    return await prisma.$transaction(async (tx) => {
      // 1. Create the new scenario
      const scenario = await tx.optimizationScenario.create({
        data: {
          ...rest,
          isDefault: isDefault || false,
        },
      });

      // 2. If this was marked default, unset others
      await handleDefaultFlag(tx, isDefault, scenario.id);

      return scenario;
    });
  } catch (error) {
    if (error.code === "P2002") {
      throw new GraphQLError("A scenario with this name already exists.");
    }
    throw error;
  }
};

export const updateOptimizationScenario = async ({ input }) => {
  const { id, isDefault, ...data } = input;

  return await prisma.$transaction(async (tx) => {
    // 1. Update the scenario
    const scenario = await tx.optimizationScenario.update({
      where: { id },
      data: {
        ...data,
        // If isDefault is provided, use it, otherwise keep existing
        ...(isDefault !== undefined && { isDefault }),
      },
    });

    // 2. If it is now default, unset others
    if (isDefault === true) {
      await handleDefaultFlag(tx, true, id);
    }

    return scenario;
  });
};

export const deleteOptimizationScenario = async ({ id }) => {
  try {
    await prisma.optimizationScenario.delete({
      where: { id },
    });
    return { success: true, message: "Scenario deleted successfully." };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// 👇 NEW MUTATION: Explicitly set default
export const setDefaultScenario = async ({ id }) => {
  console.log(`Setting scenario with ID ${id} as default.`);

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Set all to false
      await tx.optimizationScenario.updateMany({
        data: { isDefault: false },
      });

      // 2. Set specific ID to true
      await tx.optimizationScenario.update({
        where: { id },
        data: { isDefault: true },
      });
    });

    // 👇 FIX: Return the structure matching type SuccessMessage { success, message }
    return {
      success: true,
      message: "Scenario set as default successfully.",
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: `Failed to set default: ${error.message}`,
    };
  }
};
