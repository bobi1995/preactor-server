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
