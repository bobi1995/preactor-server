import prisma from "../../../../prisma/prismaClient.js";

export const getOrders = async () => {
  const orders = await prisma.orders.findMany({
    where: {
      ResourceId: "cm6j23pss0001vkic3yomyz47",
    },
    orderBy: {
      StartTime: "asc",
    },
  });
  return orders;
};

export const getOrdersByResourceId = async (resourceId) => {
  const orders = await prisma.orders.findMany({
    where: {
      ResourceId: resourceId,
    },
    orderBy: {
      StartTime: "asc",
    },
  });
  return orders;
};
