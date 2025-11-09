import prisma from "../../../../prisma/prismaClient.js";
import { GraphQLError } from "graphql";

const resourceGroupIncludes = {
  resourceLinks: {
    include: {
      resource: true,
    },
  },
  orders: true,
};

/**
 * Fetches all resource groups with related data
 * @returns {Promise<Array>} Array of all resource groups
 */
export const getResourceGroups = async () => {
  try {
    const allResourceGroups = await prisma.resourceGroup.findMany({
      include: resourceGroupIncludes,
      orderBy: {
        name: "asc",
      },
    });
    return allResourceGroups;
  } catch (error) {
    console.error("Error fetching resource groups:", error);
    throw new GraphQLError("Failed to fetch resource groups.", {
      extensions: { code: "INTERNAL_SERVER_ERROR" },
    });
  }
};

/**
 * Fetches a single resource group by ID
 * @param {number} id - The ID of the resource group
 * @returns {Promise<Object>} The resource group object
 */
export const getResourceGroup = async (id) => {
  try {
    const singleResourceGroup = await prisma.resourceGroup.findUnique({
      where: {
        id: parseInt(id),
      },
      include: resourceGroupIncludes,
    });

    if (!singleResourceGroup) {
      throw new GraphQLError("Resource group not found.", {
        extensions: { code: "NOT_FOUND" },
      });
    }

    return singleResourceGroup;
  } catch (error) {
    if (error.extensions?.code === "NOT_FOUND") {
      throw error;
    }
    console.error(`Error fetching resource group with id ${id}:`, error);
    throw new GraphQLError("Failed to fetch resource group.", {
      extensions: { code: "INTERNAL_SERVER_ERROR" },
    });
  }
};

/**
 * Fetches resource links for a specific resource group
 * @param {number} resourceGroupId - The ID of the resource group
 * @returns {Promise<Array>} Array of resource links
 */
export const getResourceLinksByGroupId = async (resourceGroupId) => {
  try {
    const links = await prisma.resourceToGroup.findMany({
      where: {
        resourceGroupId: parseInt(resourceGroupId),
      },
      include: {
        resource: true,
      },
    });
    return links;
  } catch (error) {
    console.error(
      `Error fetching resource links for group ${resourceGroupId}:`,
      error
    );
    return [];
  }
};

/**
 * Fetches orders for a specific resource group
 * @param {number} resourceGroupId - The ID of the resource group
 * @returns {Promise<Array>} Array of orders
 */
export const getOrdersByResourceGroupId = async (resourceGroupId) => {
  try {
    const orders = await prisma.order.findMany({
      where: {
        resourceGroupId: parseInt(resourceGroupId),
      },
    });
    return orders;
  } catch (error) {
    console.error(
      `Error fetching orders for resource group ${resourceGroupId}:`,
      error
    );
    return [];
  }
};
