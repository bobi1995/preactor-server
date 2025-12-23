import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const getRawOrders = async () => {
  // Fetch all raw orders, ordered by ID (or OrderNo)
  // We include attributes so they are ready for the UI
  return await prisma.orderRaw.findMany({
    orderBy: {
      orderNo: "asc",
    },
    include: {
      attributes: {
        include: {
          attribute: true,
          attributeParam: true,
        },
      },
    },
  });
};

export const getRawOrder = async (id) => {
  return await prisma.orderRaw.findUnique({
    where: { id },
    include: {
      attributes: true,
    },
  });
};
