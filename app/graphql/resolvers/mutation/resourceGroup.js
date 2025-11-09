import prisma from "../../../../prisma/prismaClient.js";
import { GraphQLError } from "graphql";

/**
 * Creates a new resource group
 * @param {Object} input - The input data for creating a resource group
 * @param {string} input.name - Name of the resource group (required)
 * @param {string} input.description - Description of the resource group (optional)
 * @returns {Promise<Object>} The created resource group
 */
export const createResourceGroup = async ({ input }) => {
  try {
    const { name, description } = input;

    const newResourceGroup = await prisma.resourceGroup.create({
      data: {
        name,
        description: description || "",
      },
      include: {
        resourceLinks: {
          include: {
            resource: true,
          },
        },
        orders: true,
      },
    });

    return newResourceGroup;
  } catch (error) {
    console.error("Error creating resource group:", error);
    if (error.code === "P2002") {
      // Unique constraint violation (name must be unique)
      throw new GraphQLError(
        "A resource group with this name already exists.",
        {
          extensions: { code: "BAD_USER_INPUT" },
        }
      );
    }
    throw new GraphQLError("Failed to create resource group.", {
      extensions: { code: "INTERNAL_SERVER_ERROR" },
    });
  }
};

/**
 * Updates an existing resource group
 * @param {Object} input - The input data for updating a resource group
 * @param {number} input.id - ID of the resource group to update (required)
 * @param {string} input.name - New name (optional)
 * @param {string} input.description - New description (optional)
 * @returns {Promise<Object>} The updated resource group
 */
export const updateResourceGroup = async ({ input }) => {
  try {
    const { id, name, description } = input;

    // Build the data object with only provided fields
    const data = {};
    if (name !== undefined) data.name = name;
    if (description !== undefined) data.description = description;

    const updatedResourceGroup = await prisma.resourceGroup.update({
      where: { id: parseInt(id) },
      data: data,
      include: {
        resourceLinks: {
          include: {
            resource: true,
          },
        },
        orders: true,
      },
    });

    return updatedResourceGroup;
  } catch (error) {
    console.error("Error updating resource group:", error);
    if (error.code === "P2025") {
      // Record to update not found
      throw new GraphQLError("Resource group not found.", {
        extensions: { code: "NOT_FOUND" },
      });
    }
    if (error.code === "P2002") {
      // Unique constraint violation
      throw new GraphQLError(
        "A resource group with this name already exists.",
        {
          extensions: { code: "BAD_USER_INPUT" },
        }
      );
    }
    throw new GraphQLError("Failed to update resource group.", {
      extensions: { code: "INTERNAL_SERVER_ERROR" },
    });
  }
};

/**
 * Deletes a resource group and all its associations
 * @param {number} id - The ID of the resource group to delete
 * @returns {Promise<Object>} Success message
 */
export const deleteResourceGroup = async ({ id }) => {
  const resourceGroupId = parseInt(id);

  try {
    // Check if the resource group exists
    const resourceGroupToDelete = await prisma.resourceGroup.findUnique({
      where: { id: resourceGroupId },
      select: { id: true, name: true },
    });

    if (!resourceGroupToDelete) {
      throw new GraphQLError("Resource group not found.", {
        extensions: { code: "NOT_FOUND" },
      });
    }

    // Perform cascading cleanup within a transaction
    await prisma.$transaction(async (tx) => {
      // Check for related Orders
      const relatedOrders = await tx.order.findFirst({
        where: { resourceGroupId: resourceGroupId },
      });

      if (relatedOrders) {
        throw new GraphQLError(
          "Cannot delete resource group. It is still linked to one or more orders.",
          { extensions: { code: "BAD_REQUEST" } }
        );
      }

      // Delete all associations in REL_Resource_group
      await tx.resourceToGroup.deleteMany({
        where: { resourceGroupId: resourceGroupId },
      });

      // Delete the resource group itself
      await tx.resourceGroup.delete({
        where: { id: resourceGroupId },
      });
    });

    return {
      success: true,
      message: `Resource group "${resourceGroupToDelete.name}" deleted successfully.`,
    };
  } catch (error) {
    if (error.extensions?.code) {
      throw error;
    }
    console.error(`Error deleting resource group ${id}:`, error);
    throw new GraphQLError("Failed to delete resource group.", {
      extensions: { code: "INTERNAL_SERVER_ERROR" },
    });
  }
};

/**
 * Adds multiple resources to a resource group
 * @param {Array<number>} resourceIds - The IDs of the resources to add
 * @param {number} resourceGroupId - The ID of the resource group
 * @returns {Promise<Object>} The updated resource group
 */
export const addResourcesToGroup = async ({ resourceIds, resourceGroupId }) => {
  const rgId = parseInt(resourceGroupId);
  const rIds = resourceIds.map((id) => parseInt(id));

  // Validate resource group ID
  if (isNaN(rgId)) {
    throw new GraphQLError("Invalid Resource Group ID.", {
      extensions: { code: "BAD_USER_INPUT" },
    });
  }

  // Validate all resource IDs
  if (!resourceIds || resourceIds.length === 0) {
    throw new GraphQLError("At least one Resource ID is required.", {
      extensions: { code: "BAD_USER_INPUT" },
    });
  }

  if (rIds.some(isNaN)) {
    throw new GraphQLError("One or more Resource IDs are invalid.", {
      extensions: { code: "BAD_USER_INPUT" },
    });
  }

  try {
    // Check if the resource group exists
    const resourceGroup = await prisma.resourceGroup.findUnique({
      where: { id: rgId },
    });

    if (!resourceGroup) {
      throw new GraphQLError("Resource group not found.", {
        extensions: { code: "NOT_FOUND" },
      });
    }

    // Check if all resources exist
    const resources = await prisma.resource.findMany({
      where: { id: { in: rIds } },
    });

    if (resources.length !== rIds.length) {
      const foundIds = resources.map((r) => r.id);
      const missingIds = rIds.filter((id) => !foundIds.includes(id));
      throw new GraphQLError(`Resources not found: ${missingIds.join(", ")}`, {
        extensions: { code: "NOT_FOUND" },
      });
    }

    // Check for existing links
    const existingLinks = await prisma.resourceToGroup.findMany({
      where: {
        resourceId: { in: rIds },
        resourceGroupId: rgId,
      },
    });

    const alreadyLinkedIds = existingLinks.map((link) => link.resourceId);
    const newResourceIds = rIds.filter((id) => !alreadyLinkedIds.includes(id));

    // Create new links only for resources that aren't already linked
    if (newResourceIds.length > 0) {
      await prisma.resourceToGroup.createMany({
        data: newResourceIds.map((resourceId) => ({
          resourceId,
          resourceGroupId: rgId,
        })),
      });
    }

    // Return the updated resource group
    const updatedResourceGroup = await prisma.resourceGroup.findUnique({
      where: { id: rgId },
      include: {
        resourceLinks: {
          include: {
            resource: true,
          },
        },
        orders: true,
      },
    });

    return updatedResourceGroup;
  } catch (error) {
    if (error.extensions?.code) {
      throw error;
    }
    console.error("Error adding resources to group:", error);
    throw new GraphQLError("Failed to add resources to group.", {
      extensions: { code: "INTERNAL_SERVER_ERROR" },
    });
  }
};

/**
 * Removes a resource from a resource group
 * @param {number} resourceId - The ID of the resource
 * @param {number} resourceGroupId - The ID of the resource group
 * @returns {Promise<Object>} Success message
 */
export const removeResourceFromGroup = async ({
  resourceId,
  resourceGroupId,
}) => {
  const rId = parseInt(resourceId);
  const rgId = parseInt(resourceGroupId);

  if (isNaN(rId)) {
    throw new GraphQLError("Invalid Resource ID.", {
      extensions: { code: "BAD_USER_INPUT" },
    });
  }
  if (isNaN(rgId)) {
    throw new GraphQLError("Invalid Resource Group ID.", {
      extensions: { code: "BAD_USER_INPUT" },
    });
  }

  try {
    // Check if the link exists
    const existingLink = await prisma.resourceToGroup.findUnique({
      where: {
        resourceId_resourceGroupId: {
          resourceId: rId,
          resourceGroupId: rgId,
        },
      },
    });

    if (!existingLink) {
      throw new GraphQLError("Resource is not linked to this resource group.", {
        extensions: { code: "NOT_FOUND" },
      });
    }

    // Delete the link
    await prisma.resourceToGroup.delete({
      where: {
        resourceId_resourceGroupId: {
          resourceId: rId,
          resourceGroupId: rgId,
        },
      },
    });

    return {
      success: true,
      message: "Resource removed from group successfully.",
    };
  } catch (error) {
    if (error.extensions?.code) {
      throw error;
    }
    console.error("Error removing resource from group:", error);
    throw new GraphQLError("Failed to remove resource from group.", {
      extensions: { code: "INTERNAL_SERVER_ERROR" },
    });
  }
};

/**
 * Removes all resources from a resource group
 * @param {number} resourceGroupId - The ID of the resource group
 * @returns {Promise<Object>} Success message with count of removed resources
 */
export const removeAllResourcesFromGroup = async ({ resourceGroupId }) => {
  const rgId = parseInt(resourceGroupId);

  if (isNaN(rgId)) {
    throw new GraphQLError("Invalid Resource Group ID.", {
      extensions: { code: "BAD_USER_INPUT" },
    });
  }

  try {
    // Check if the resource group exists
    const resourceGroup = await prisma.resourceGroup.findUnique({
      where: { id: rgId },
      select: { id: true, name: true },
    });

    if (!resourceGroup) {
      throw new GraphQLError("Resource group not found.", {
        extensions: { code: "NOT_FOUND" },
      });
    }

    // Count existing links before deletion
    const linkCount = await prisma.resourceToGroup.count({
      where: { resourceGroupId: rgId },
    });

    // Delete all links for this resource group
    await prisma.resourceToGroup.deleteMany({
      where: { resourceGroupId: rgId },
    });

    return {
      success: true,
      message: `Removed ${linkCount} resource(s) from group "${resourceGroup.name}".`,
    };
  } catch (error) {
    if (error.extensions?.code) {
      throw error;
    }
    console.error("Error removing all resources from group:", error);
    throw new GraphQLError("Failed to remove all resources from group.", {
      extensions: { code: "INTERNAL_SERVER_ERROR" },
    });
  }
};
