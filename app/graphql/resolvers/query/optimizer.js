import prisma from "../../../../prisma/prismaClient.js";

// Helper to convert CSV string to Array
const parsePriority = (csv) => {
  if (!csv || csv.trim() === "") return [];
  return csv
    .split(",")
    .map((id) => parseInt(id))
    .filter((n) => !isNaN(n));
};

export const getOptimizerSettings = async () => {
  // Fetch the singleton row (ID 1)
  const settings = await prisma.optimizerSetting.findFirst();

  // Return default object if table is empty
  if (!settings) {
    return {
      id: 0,
      strategy: "balanced",
      campaignWindowDays: 0,
      gravity: true,
      resourcePriority: [], // ✅ RETURN EMPTY ARRAY, NOT STRING
      updatedAt: new Date(),
    };
  }

  // ✅ Manual conversion before returning to GraphQL
  return {
    ...settings,
    resourcePriority: parsePriority(settings.resourcePriority),
  };
};

export const getOptimizerExecutions = async () => {
  const executions = await prisma.optimizerExecution.findMany({
    orderBy: { startTime: "desc" },
    take: 50,
  });

  // ✅ Convert the priority string to array for executions too
  return executions.map((exec) => ({
    ...exec,
    resourcePriority: parsePriority(exec.resourcePriority),
  }));
};
