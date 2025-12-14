import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const createAttribute = async ({ input }) => {
  const { name, parameters } = input;
  return await prisma.attribute.create({
    data: {
      name,
      attributeParameters: {
        create: parameters || [], // Handles nested creation of values like "Red", "Green"
      },
    },
    include: { attributeParameters: true },
  });
};

export const updateAttribute = async ({ id, input }) => {
  return await prisma.attribute.update({
    where: { id },
    data: { ...input },
  });
};

export const deleteAttribute = async ({ id }) => {
  // Note: This might fail if there are related ChangeoverData/Times.
  // Prisma relations handle cascading if configured, otherwise we delete manually.
  try {
    // Delete parameters first (if cascade isn't set in DB)
    await prisma.attrParam.deleteMany({ where: { attributeId: id } });
    await prisma.attribute.delete({ where: { id } });
    return { success: true, message: "Attribute deleted successfully" };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const createAttrParam = async ({ input }) => {
  return await prisma.attrParam.create({
    data: input,
  });
};

export const deleteAttrParam = async ({ id }) => {
  try {
    await prisma.attrParam.delete({ where: { id } });
    return { success: true, message: "Parameter deleted" };
  } catch (error) {
    return { success: false, message: error.message };
  }
};
