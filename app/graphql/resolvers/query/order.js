import prisma from "../../../../prisma/prismaClient.js";

export const getOrders = async () => {
  const orders = await prisma.orders.findMany({
    orderBy: {
      StartTime: "asc",
    },
  });
  return orders;
};

export const getOrdersByResourceId = async (resourceId) => {
  const orders = await prisma.orders.findMany({
    where: {
      Resource: resourceId,
    },
    orderBy: {
      StartTime: "asc",
    },
  });
  return orders;
};
