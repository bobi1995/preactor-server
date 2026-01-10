import prisma from "../../../../prisma/prismaClient.js";

export const getOptimizationScenarios = async () => {
  return await prisma.optimizationScenario.findMany({
    orderBy: { name: "asc" },
  });
};

// 👇 ADD THIS (Query Resolver: Get One by ID)
export const getOptimizationScenario = async ({ id }) => {
  return await prisma.optimizationScenario.findUnique({
    where: { id },
  });
};
