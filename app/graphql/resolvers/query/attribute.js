import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const getAttributes = async () => {
  return await prisma.attribute.findMany({
    include: { attributeParameters: true },
  });
};

export const getAttribute = async (id) => {
  return await prisma.attribute.findUnique({
    where: { id },
    include: { attributeParameters: true },
  });
};

// --- HELPER FUNCTIONS. They are not included as queries. ---

export const getAttributeParameters = async (attributeId) => {
  return await prisma.attrParam.findMany({
    where: { attributeId },
  });
};

export const getAttrParam = async (id) => {
  return await prisma.attrParam.findUnique({
    where: { id },
  });
};
