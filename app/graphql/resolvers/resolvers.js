import { GraphQLError } from "graphql";
import {
  assignScheduleToResource,
  createResource,
  deleteAlternativeShift,
  assignAlternativeShiftToResource,
  deleteResource,
  updateResource,
} from "./mutation/resource.js";
import { getResources, getResource } from "./query/resource.js";
import {
  getShiftById,
  getShifts,
  getShiftBreaks,
  getAlternativeShifts,
  getShiftsByBreakId,
} from "./query/shift.js";
import { createShift, deleteShift, updateShift } from "./mutation/shift.js";
import {
  createBreak,
  assignBreakToShift,
  removeBreakFromShift,
  deleteBreak,
  updateBreak,
} from "./mutation/break.js";
import { getScheduleById, getSchedules } from "./query/schedule.js";
import {
  createSchedule,
  deleteSchedule,
  updateSchedule,
} from "./mutation/schedule.js";
import { getBreaks } from "./query/break.js";
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
      if (id) {
        const shift = await getShiftById(id);
        if (!shift) {
          throw notFoundError("Shift not found");
        }
        return shift;
      } else {
        throw new Error("ID_NOT_PROVIDED");
      }
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
    //SHIFT-RELATED MUTATIONS
    createShift: async (_, { input }) => createShift({ input }),
    updateShift: async (_, { id, input }) => updateShift({ id, input }),
    createResource: async (_, { input }) => createResource({ input }),
    deleteShift: async (_, { id }) => deleteShift({ id }),
    //SCHEDULE-RELATED MUTATIONS
    createSchedule: async (_, { input }) => createSchedule({ input }),
    updateSchedule: async (_, { id, input }) => updateSchedule({ id, input }),
    deleteSchedule: async (_, { id }) => deleteSchedule({ id }),
    // createGroup: async (_, { name, description }) =>
    // createGroup({ name, description }),
    //BREAK-RELATED MUTATIONS
    createBreak: async (_, { input }) => createBreak({ input }),
    updateBreak: async (_, { id, input }) => updateBreak({ id, input }),
    assignBreakToShift: async (_, { shiftId, breakId }) =>
      assignBreakToShift({ shiftId, breakId }),
    deleteBreak: async (_, { id }) => deleteBreak({ id }),
    removeBreakFromShift: async (_, { shiftId, breakId }) =>
      removeBreakFromShift({ shiftId, breakId }),
    deleteAlternativeShift: async (_, { id }) => deleteAlternativeShift({ id }),
    //RESOURCE MUTATIONS
    updateResource: async (_, { id, input }) =>
      updateResource(_, { id, input }),
    deleteResource: async (_, { id }) => deleteResource(_, { id }),

    //RESOURCE-RELATED MUTATIONS
    assignScheduleToResource: async (_, { resourceId, scheduleId }) =>
      assignScheduleToResource({ resourceId, scheduleId }),
    assignAlternativeShiftToResource: async (_, { resourceId, shiftId }) =>
      assignAlternativeShiftToResource({ resourceId, shiftId }),
    // deleteResourceFromGroup: async (_, { groupId, resourceId }) =>
    //   removeResourceFromGroup({ groupId, resourceId }),
  },
  Resource: {
    schedule: (resource) =>
      resource.scheduleId ? getScheduleById(resource.scheduleId) : null,
    alternativeShifts: (resource) => getAlternativeShifts(resource.id),
    orders: (resource) => getOrdersByResourceId(resource.id),
    // groups: (resource) => getResourcesByGroupId(resource.id),
  },
  // Group: {
  //   resources: (group) => {
  //     return getResourcesByGroupId(group.id);
  //   },
  // },
  Shift: {
    startHour: (shift) => shift.startHour,
    endHour: (shift) => shift.endHour,
    breaks: (shift) => getShiftBreaks(shift.id),
  },
  Schedule: {
    monday: (schedule) =>
      schedule.mondayId ? getShiftById(schedule.mondayId) : null,
    tuesday: (schedule) =>
      schedule.tuesdayId ? getShiftById(schedule.tuesdayId) : null,
    wednesday: (schedule) =>
      schedule.wednesdayId ? getShiftById(schedule.wednesdayId) : null,
    thursday: (schedule) =>
      schedule.thursdayId ? getShiftById(schedule.thursdayId) : null,
    friday: (schedule) =>
      schedule.fridayId ? getShiftById(schedule.fridayId) : null,
    saturday: (schedule) =>
      schedule.saturdayId ? getShiftById(schedule.saturdayId) : null,
    sunday: (schedule) =>
      schedule.sundayId ? getShiftById(schedule.sundayId) : null,
  },
  Break: {
    startTime: (breakObj) => breakObj.startTime,
    endTime: (breakObj) => breakObj.endTime,
    shifts: (breakObj) => {
      return getShiftsByBreakId(breakObj.id);
    },
  },
};

const notFoundError = (message) =>
  new GraphQLError(message, {
    extensions: {
      code: "NOT_FOUND",
    },
  });
