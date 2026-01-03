import { PrismaClient } from "@prisma/client";
import { GraphQLError } from "graphql";

const prisma = new PrismaClient();

export const addOrderAttribute = async ({ input }) => {
  const { orderId, attributeId, attributeParamId, value } = input;

  // 1. Validate that the target Order exists (The "Single Source of Truth")
  const orderExists = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!orderExists) {
    throw new GraphQLError(`Order with ID ${orderId} not found.`);
  }

  // 2. Fetch the Attribute Definition to check 'isParam'
  const attributeDef = await prisma.attribute.findUnique({
    where: { id: attributeId },
  });

  if (!attributeDef) {
    throw new GraphQLError("Attribute definition not found");
  }

  // 3. Validate Inputs based on isParam
  let finalParamId = null;
  let finalValue = null;

  if (attributeDef.isParam) {
    // Case: Dropdown / Parameter required
    if (!attributeParamId) {
      throw new GraphQLError(
        `Attribute '${attributeDef.name}' requires a selected Parameter (attributeParamId).`
      );
    }
    finalParamId = attributeParamId;
    finalValue = null; // Ignore text value if sent
  } else {
    // Case: Free Text required
    if (!value) {
      throw new GraphQLError(
        `Attribute '${attributeDef.name}' requires a text Value.`
      );
    }
    finalValue = value;
    finalParamId = null; // Ignore paramId if sent
  }

  // 4. Create the assignment linked to the main Order table
  return await prisma.orderAttribute.create({
    data: {
      orderId, // This now links to the 'Order' model
      attributeId,
      attributeParamId: finalParamId,
      value: finalValue,
    },
  });
};

export const updateOrderAttribute = async ({ id, input }) => {
  const { attributeParamId, value } = input;

  // 1. Find existing record to know which Attribute definition it uses
  const existingRecord = await prisma.orderAttribute.findUnique({
    where: { id },
    include: { attribute: true },
  });

  if (!existingRecord) {
    throw new GraphQLError("Order Attribute record not found");
  }

  const isParam = existingRecord.attribute.isParam;
  let finalParamId = existingRecord.attributeParamId;
  let finalValue = existingRecord.value;

  // 2. Apply updates based on type
  if (isParam) {
    // Only update paramId if provided
    if (attributeParamId !== undefined) {
      finalParamId = attributeParamId;
      finalValue = null;
    }
  } else {
    // Only update value if provided
    if (value !== undefined) {
      finalValue = value;
      finalParamId = null;
    }
  }

  return await prisma.orderAttribute.update({
    where: { id },
    data: {
      attributeParamId: finalParamId,
      value: finalValue,
    },
  });
};

export const deleteOrderAttribute = async ({ id }) => {
  try {
    await prisma.orderAttribute.delete({ where: { id } });
    return { success: true, message: "Attribute removed from order." };
  } catch (error) {
    return { success: false, message: error.message };
  }
};
