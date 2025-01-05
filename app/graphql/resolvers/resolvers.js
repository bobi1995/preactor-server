import { GraphQLError } from "graphql";
import {
  assignAlternativeShift,
  assignShiftToResource,
  createResource,
} from "./mutation/resource.js";
import {
  getReplacements,
  getResources,
  getResource,
  getCanReplace,
  getResourcesByRegularShiftId,
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
  deleteBreak,
  deleteBreakFromShift,
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
    assignShiftToResource: async (_, { resourceId, shiftId }) =>
      assignShiftToResource({ resourceId, shiftId }),
    assignAlternativeShiftToResource: async (
      _,
      { resourceId, shiftId, startDate, endDate }
    ) => {
      return assignAlternativeShift({
        resourceId,
        shiftId,
        startDate,
        endDate,
      });
    },
    deleteBreak: async (_, { id }) => deleteBreak({ id }),
    deleteBreakFromShift: async (_, { shiftId, breakId }) =>
      deleteBreakFromShift({ shiftId, breakId }),
  },
  Resource: {
    regularShift: (resource) =>
      resource.regularShiftId ? getShiftById(resource.regularShiftId) : null,
    alternateShifts: (resource) => getAlternateShifts(resource.id),
    restrictions: (resource) =>
      resource.restrictions ? getRestrictions(resource.id) : [],
    orders: () => [],
  },
  Shift: {
    startHour: (shift) => shift.startHour,
    endHour: (shift) => shift.endHour,
    breaks: (shift) => getShiftBreaks(shift.id),
    resources: (shift) => getResourcesByRegularShiftId(shift.id),
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
