import prisma from "../../../../prisma/prismaClient.js";
import { GraphQLError } from "graphql";

const resourceIncludes = {
  schedule: true,
  changeoverGroup: true,
  alternativeShifts: true,
};

export const getResources = async () => {
  try {
    const allResources = await prisma.resource.findMany({
      include: resourceIncludes,
      orderBy: {
        name: "asc",
      },
    });
    return allResources;
  } catch (error) {
    console.error("Error fetching resources:", error);
    throw new GraphQLError("Failed to fetch resources.", {
      extensions: { code: "INTERNAL_SERVER_ERROR" },
    });
  }
};

export const getResource = async (id) => {
  try {
    const singleResource = await prisma.resource.findUnique({
      where: {
        id: parseInt(id),
      },
      include: {
        ...resourceIncludes,
      },
    });

    if (!singleResource) {
      throw new GraphQLError("Resource not found.", {
        extensions: { code: "NOT_FOUND" },
      });
    }

    return singleResource;
  } catch (error) {
    if (error.extensions?.code === "NOT_FOUND") {
      throw error;
    }
    console.error(`Error fetching resource with id ${id}:`, error);
    throw new GraphQLError("Failed to fetch resource.", {
      extensions: { code: "INTERNAL_SERVER_ERROR" },
    });
  }
};

/**
 * Fetches all resources that don't belong to any resource group
 * @returns {Promise<Array>} Array of resources without group assignments
 */
export const getResourcesWithoutGroup = async () => {
  try {
    const resourcesWithoutGroup = await prisma.resource.findMany({
      where: {
        resourceGroupLinks: {
          none: {}, // No links in the ResourceToGroup table
        },
      },
      include: resourceIncludes,
      orderBy: {
        name: "asc",
      },
    });
    return resourcesWithoutGroup;
  } catch (error) {
    console.error("Error fetching resources without group:", error);
    throw new GraphQLError("Failed to fetch resources without group.", {
      extensions: { code: "INTERNAL_SERVER_ERROR" },
    });
  }
};
