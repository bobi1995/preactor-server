import { GraphQLError } from "graphql";
import prisma from "../../../../prisma/prismaClient.js";

export const createBreak = async ({ input }) => {
  const newBreak = await prisma.break.create({
    data: {
      name: input.name,
      startTime: input.startTime,
      endTime: input.endTime,
    },
  });
  return newBreak;
};

export const assignBreakToShift = async ({ shiftId, breakId }) => {
  // Проверка за съществуваща връзка, за да не се създават дубликати
  const existingLink = await prisma.breakToShift.findFirst({
    where: {
      shiftId: parseInt(shiftId),
      breakId: parseInt(breakId),
    },
  });

  if (existingLink) {
    // Ако връзката вече съществува, просто връщаме смяната.
    return prisma.shift.findUnique({ where: { id: parseInt(shiftId) } });
  }

  await prisma.breakToShift.create({
    data: {
      shiftId: parseInt(shiftId),
      breakId: parseInt(breakId),
    },
  });
  // Връщаме обновения обект на смяната, за да може Apollo кешът да се актуализира
  return prisma.shift.findUnique({ where: { id: parseInt(shiftId) } });
};
export const deleteBreak = async ({ id }) => {
  if (!id) {
    throw new GraphQLError("ID на почивката трябва да бъде предоставено.", {
      extensions: { code: "BAD_USER_INPUT" },
    });
  }

  const breakId = parseInt(id);
  if (isNaN(breakId)) {
    throw new GraphQLError("Невалиден формат на ID на почивката.", {
      extensions: { code: "BAD_USER_INPUT" },
    });
  }

  try {
    // Стъпка 1: Проверка дали почивката е присвоена към някоя смяна.
    const assignmentCount = await prisma.breakToShift.count({
      where: {
        breakId: breakId,
      },
    }); // Стъпка 2: Ако е присвоена, хвърляме грешка и спираме процеса.

    if (assignmentCount > 0) {
      throw new GraphQLError(
        "Не може да изтриете тази почивка, защото е присвоена към една или повече смени. Моля, първо премахнете връзките.",
        {
          extensions: { code: "BREAK_IN_USE" },
        }
      );
    } // Стъпка 3: Ако няма връзки, изтриваме почивката.

    await prisma.break.delete({
      where: {
        id: breakId,
      },
    });

    return {
      success: true,
      message: "Почивката е изтрита успешно.",
    };
  } catch (error) {
    // Прехвърляме нашата персонализирана грешка, ако съществува.
    if (error instanceof GraphQLError) {
      throw error;
    } // Обработка на случай, в който почивката не е намерена.

    if (error.code === "P2025") {
      throw new GraphQLError("Почивката не е намерена.", {
        extensions: { code: "NOT_FOUND" },
      });
    } // За всички други неочаквани грешки.

    console.error("Грешка при изтриване на почивка:", error);
    throw new GraphQLError(
      "Възникна неочаквана грешка при опит за изтриване на почивката.",
      {
        extensions: { code: "INTERNAL_SERVER_ERROR" },
      }
    );
  }
};
export const removeBreakFromShift = async ({ shiftId, breakId }) => {
  // ОПТИМИЗАЦИЯ: Използваме deleteMany с композитен ключ за директно изтриване.
  // Това е по-ефективно, защото не изисква първо да намираме записа.
  await prisma.breakToShift.deleteMany({
    where: {
      shiftId: parseInt(shiftId),
      breakId: parseInt(breakId),
    },
  });

  // Връщаме обновения обект на смяната, за да може Apollo кешът да се актуализира
  return prisma.shift.findUnique({ where: { id: parseInt(shiftId) } });
};

export const updateBreak = async ({ id, input }) => {
  const updatedBreak = await prisma.break.update({
    where: {
      id: parseInt(id),
    },
    data: {
      name: input.name,
      startTime: input.startTime,
      endTime: input.endTime,
    },
  });
  return updatedBreak;
};
