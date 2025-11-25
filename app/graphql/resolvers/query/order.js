import prisma from "../../../../prisma/prismaClient.js";
import { GraphQLError } from "graphql";

const orderIncludes = {
  resource: true,
  resourceGroup: true,
};

/**
 * Fetches all orders with related resource and resource group data
 * @returns {Promise<Array>} Array of all orders
 */
export const getOrders = async () => {
  try {
    const allOrders = await prisma.order.findMany({
      include: orderIncludes,
      orderBy: {
        startTime: "asc",
      },
    });
    return allOrders;
  } catch (error) {
    console.error("Error fetching orders:", error);
    throw new GraphQLError("Failed to fetch orders.", {
      extensions: { code: "INTERNAL_SERVER_ERROR" },
    });
  }
};

/**
 * Fetches all orders for a specific resource
 * @param {number} resourceId - The ID of the resource
 * @returns {Promise<Array>} Array of orders for the specified resource
 */
export const getOrdersByResource = async (resourceId) => {
  try {
    const orders = await prisma.order.findMany({
      where: {
        resourceId: parseInt(resourceId),
      },
      include: orderIncludes,
      orderBy: {
        startTime: "asc",
      },
    });
    return orders;
  } catch (error) {
    console.error(`Error fetching orders for resource ${resourceId}:`, error);
    throw new GraphQLError("Failed to fetch orders for resource.", {
      extensions: { code: "INTERNAL_SERVER_ERROR" },
    });
  }
};

/**
 * Fetches all orders for a specific resource group
 * This finds all resources in the group and returns orders for those resources
 * @param {number} resourceGroupId - The ID of the resource group
 * @returns {Promise<Array>} Array of orders for resources in the specified group
 */
export const getOrdersByResourceGroup = async (resourceGroupId) => {
  try {
    const rgId = parseInt(resourceGroupId);

    // First, find all resource IDs that belong to this resource group
    const resourceLinks = await prisma.resourceToGroup.findMany({
      where: {
        resourceGroupId: rgId,
      },
      select: {
        resourceId: true,
      },
    });

    // Extract the resource IDs
    const resourceIds = resourceLinks.map((link) => link.resourceId);

    // If no resources in the group, return empty array
    if (resourceIds.length === 0) {
      return [];
    }

    // Fetch all orders for these resources
    const orders = await prisma.order.findMany({
      where: {
        resourceId: {
          in: resourceIds,
        },
      },
      include: orderIncludes,
      orderBy: {
        startTime: "asc",
      },
    });

    return orders;
  } catch (error) {
    console.error(
      `Error fetching orders for resource group ${resourceGroupId}:`,
      error
    );
    throw new GraphQLError("Failed to fetch orders for resource group.", {
      extensions: { code: "INTERNAL_SERVER_ERROR" },
    });
  }
};

/**
 * Helper function to get orders by resource ID (used by Resource type resolver)
 * @param {number} resourceId - The ID of the resource
 * @returns {Promise<Array>} Array of orders
 */
export const getOrdersByResourceId = async (resourceId) => {
  return getOrdersByResource(resourceId);
};
