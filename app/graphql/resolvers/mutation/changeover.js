import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// --- Group Management ---

export const createChangeoverGroup = async ({ name }) => {
  return await prisma.changeoverGroup.create({ data: { name } });
};

export const updateChangeoverGroup = async ({ id, name }) => {
  return await prisma.changeoverGroup.update({
    where: { id },
    data: { name },
  });
};

export const deleteChangeoverGroup = async ({ id }) => {
  try {
    await prisma.changeoverGroup.delete({ where: { id } });
    return { success: true, message: "Changeover Group deleted" };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const setChangeoverTime = async ({ input }) => {
  const { changeoverGroupId, attributeId, changeoverTime } = input;

  // Since schema.prisma doesn't have a unique compound key on [changeoverGroupId, attributeId],
  // we cannot use prisma.upsert directly. We must find first, then update or create.

  const existingRecord = await prisma.changeoverTime.findFirst({
    where: {
      changeoverGroupId,
      attributeId,
    },
  });

  if (existingRecord) {
    return await prisma.changeoverTime.update({
      where: { id: existingRecord.id },
      data: { changeoverTime },
    });
  } else {
    return await prisma.changeoverTime.create({
      data: {
        changeoverGroupId,
        attributeId,
        changeoverTime,
      },
    });
  }
};

export const setChangeoverData = async ({ input }) => {
  const {
    changeoverGroupId,
    attributeId,
    fromAttrParamId,
    toAttrParamId,
    setupTime,
  } = input;

  // Manual Upsert Logic for detailed matrix cells
  const existingRecord = await prisma.changeoverData.findFirst({
    where: {
      changeoverGroupId,
      attributeId,
      fromAttrParamId,
      toAttrParamId,
    },
  });

  if (existingRecord) {
    return await prisma.changeoverData.update({
      where: { id: existingRecord.id },
      data: { setupTime },
    });
  } else {
    return await prisma.changeoverData.create({
      data: {
        changeoverGroupId,
        attributeId,
        fromAttrParamId,
        toAttrParamId,
        setupTime,
      },
    });
  }
};

export const deleteChangeoverTime = async ({ id }) => {
  try {
    // 1. First, we must find the record to know which Group and Attribute it belongs to
    const recordToDelete = await prisma.changeoverTime.findUnique({
      where: { id },
    });

    if (!recordToDelete) {
      return { success: false, message: "Record not found" };
    }

    const { changeoverGroupId, attributeId } = recordToDelete;

    // 2. Use a Transaction to delete the Matrix Data AND the Time Record atomically
    await prisma.$transaction([
      // Step A: Delete all matrix cells (ChangeoverData) for this specific Group + Attribute
      prisma.changeoverData.deleteMany({
        where: {
          changeoverGroupId: changeoverGroupId,
          attributeId: attributeId,
        },
      }),

      // Step B: Delete the ChangeoverTime record itself
      prisma.changeoverTime.delete({
        where: { id },
      }),
    ]);

    return {
      success: true,
      message: "Attribute and all associated matrix data removed from group.",
    };
  } catch (error) {
    console.error(error);
    return { success: false, message: error.message };
  }
};

export const deleteChangeoverData = async ({ id }) => {
  try {
    await prisma.changeoverData.delete({
      where: { id },
    });
    return { success: true, message: "Changeover data deleted." };
  } catch (error) {
    return { success: false, message: error.message };
  }
};
