import { GraphQLError } from "graphql";
import {
  assignAlternativeShift,
  assignMassiveAlternative,
  assignSchedule,
  createResource,
  deleteAlternativeShift,
} from "./mutation/resource.js";
import {
  getResources,
  getResource,
  getResourcesByGroupId,
} from "./query/resource.js";
import {
  getShiftById,
  getShifts,
  getBreaks,
  getShiftBreaks,
  getAlternativeShifts,
} from "./query/shift.js";
import { createShift } from "./mutation/shift.js";
import {
  createBreak,
  assignBreakToShift,
  removeBreakFromShift,
} from "./mutation/break.js";
import { getScheduleById, getSchedules } from "./query/schedule.js";
import {
  createSchedule,
  deleteSchedule,
  updateSchedule,
} from "./mutation/schedule.js";
import { getGroups } from "./query/group.js";
import {
  addResourceToGroup,
  createGroup,
  removeResourceFromGroup,
} from "./mutation/groups.js";
import { getOrders, getOrdersByResourceId } from "./query/order.js";

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
    //getGroups: () => getGroups(),
    getShifts: () => getShifts(),
    getShift: async (_, { id }) => {
      const shift = await getShiftById(id);
      if (!shift) {
        throw notFoundError("Shift not found");
      }
      return shift;
    },
    getBreaks: () => getBreaks(),
    getSchedules: () => getSchedules(),
    getSchedule: async (_, { id }) => {
      const schedule = await getScheduleById(id);
      if (!schedule) {
        throw notFoundError("Schedule not found");
      }
      return schedule;
    },
    getOrders: () => getOrders(),
  },
  Mutation: {
    createResource: async (_, { input }) => createResource({ input }),
    // createGroup: async (_, { name, description }) =>
    // createGroup({ name, description }),
    createShift: async (_, { input }) => createShift({ input }),
    createBreak: async (_, { input }) => createBreak({ input }),
    createSchedule: async (_, { name }) => createSchedule({ name }),
    updateSchedule: async (_, { id, input }) => updateSchedule({ id, input }),
    assignBreakToShift: async (_, { shiftId, breakId }) =>
      assignBreakToShift({ shiftId, breakId }),

    deleteBreak: async (_, { id }) => deleteBreak({ id }),
    removeBreakFromShift: async (_, { shiftId, breakId }) =>
      removeBreakFromShift({ shiftId, breakId }),
    deleteAlternativeShift: async (_, { id }) => deleteAlternativeShift({ id }),
    deleteSchedule: async (_, { id }) => deleteSchedule({ id }),
    // deleteResourceFromGroup: async (_, { groupId, resourceId }) =>
    //   removeResourceFromGroup({ groupId, resourceId }),
  },
  Resources: {
    weekSchedule: (resource) =>
      resource.scheduleId ? getScheduleById(resource.scheduleId) : null,
    alternativeShifts: (resource) => getAlternativeShifts(resource.id),
    orders: (resource) => getOrdersByResourceId(resource.id),
    // groups: (resource) => getResourcesByGroupId(resource.id),
    regularShift: (resource) =>
      resource.regularShiftId ? getShiftById(resource.regularShiftId) : null,
  },
  // Group: {
  //   resources: (group) => {
  //     return getResourcesByGroupId(group.id);
  //   },
  // },
  Shifts: {
    startHour: (shift) => shift.startHour,
    endHour: (shift) => shift.endHour,
    breaks: (shift) => getShiftBreaks(shift.id),
  },
  WeekSchedules: {
    monday: (schedule) =>
      schedule.monday ? getShiftById(schedule.monday) : null,
    tuesday: (schedule) =>
      schedule.tuesday ? getShiftById(schedule.tuesday) : null,
    wednesday: (schedule) =>
      schedule.wednesday ? getShiftById(schedule.wednesday) : null,
    thursday: (schedule) =>
      schedule.thursday ? getShiftById(schedule.thursday) : null,
    friday: (schedule) =>
      schedule.friday ? getShiftById(schedule.friday) : null,
    saturday: (schedule) =>
      schedule.saturday ? getShiftById(schedule.saturday) : null,
    sunday: (schedule) =>
      schedule.sunday ? getShiftById(schedule.sunday) : null,
  },
  Breaks: {
    startTime: (breakObj) => breakObj.startTime,
    endTime: (breakObj) => breakObj.endTime,
  },
};

const notFoundError = (message) =>
  new GraphQLError(message, {
    extensions: {
      code: "NOT_FOUND",
    },
  });
