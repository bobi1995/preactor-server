import { GraphQLError } from "graphql";
import { createResource } from "./mutation/resource.js";
import {
  getReplacements,
  getResources,
  getResource,
  getCanReplace,
} from "./query/resource.js";
import { getRestrictions } from "./query/restriction.js";
import {
  getShiftById,
  getAlternateShifts,
  getShifts,
  getBreaks,
  getShiftBreaks,
} from "./query/shift.js";
import {
  assignBreakToShift,
  createBreak,
  createShift,
} from "./mutation/shift.js";

export const resolvers = {
  Query: {
    hello: () => "Hello World",
    getResources: () => getResources(),
    getResource: async (_, { id }) => {
      const resource = await getResource(id);
      if (!resource) {
        throw notFoundError("Resource not found");
      }
      return resource;
    },
    getShifts: () => getShifts(),
    getShift: async (_, { id }) => {
      const shift = await getShiftById(id);
      if (!shift) {
        throw notFoundError("Shift not found");
      }
      return shift;
    },
    getBreaks: () => getBreaks(),
  },
  Mutation: {
    createResource: async (_, { input }) => createResource({ input }),
    createShift: async (_, { input }) => createShift({ input }),
    createBreak: async (_, { input }) => createBreak({ input }),
    assignBreakToShift: async (_, { shiftId, breakId }) =>
      assignBreakToShift({ shiftId, breakId }),
  },
  Resource: {
    regularShift: (resource) =>
      resource.regularShift ? getShiftById(resource.regularShift) : null,
    alternateShifts: (resource) =>
      resource.alternateShifts ? getAlternateShifts(resource.id) : [],
    replacedBy: (resource) =>
      resource.replacedBy ? getReplacements(resource.id) : [],
    canReplace: (resource) =>
      resource.replacedBy ? getCanReplace(resource.id) : [],
    restrictions: (resource) =>
      resource.restrictions ? getRestrictions(resource.id) : [],
    orders: () => [],
  },
  Shift: {
    startHour: (shift) => shift.startHour,
    endHour: (shift) => shift.endHour,
    breaks: (shift) => getShiftBreaks(shift.id),
  },
  Break: {
    startHour: (shift) => shift.startHour,
    endHour: (shift) => shift.endHour,
  },
};

const notFoundError = (message) =>
  new GraphQLError(message, {
    extensions: {
      code: "NOT_FOUND",
    },
  });
