import { GraphQLError } from "graphql";
import {
  assignAlternativeShift,
  assignMassiveAlternative,
  assignSchedule,
  createResource,
} from "./mutation/resource.js";
import { getResources, getResource } from "./query/resource.js";
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
import { getScheduleById, getSchedules } from "./query/schedule.js";
import { createSchedule, updateSchedule } from "./mutation/schedule.js";

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
    getSchedules: () => getSchedules(),
    getSchedule: async (_, { id }) => {
      const schedule = await getScheduleById(id);
      if (!schedule) {
        throw notFoundError("Schedule not found");
      }
      return schedule;
    },
  },
  Mutation: {
    createResource: async (_, { input }) => createResource({ input }),
    createShift: async (_, { input }) => createShift({ input }),
    createBreak: async (_, { input }) => createBreak({ input }),
    createSchedule: async (_, { name }) => createSchedule({ name }),
    updateSchedule: async (_, { id, input }) => updateSchedule({ id, input }),
    assignBreakToShift: async (_, { shiftId, breakId }) =>
      assignBreakToShift({ shiftId, breakId }),
    assignSchedule: async (_, { resourceId, scheduleId }) =>
      assignSchedule({ resourceId, scheduleId }),
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
    assignMassiveAlternative: async (
      _,
      { resourceIds, shiftId, startDate, endDate }
    ) => {
      return assignMassiveAlternative({
        resourceIds,
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
    schedule: (resource) =>
      resource.scheduleId ? getScheduleById(resource.scheduleId) : null,
    alternateShifts: (resource) => getAlternateShifts(resource.id),
    restrictions: (resource) =>
      resource.restrictions ? getRestrictions(resource.id) : [],
    orders: () => [],
  },
  Shift: {
    startHour: (shift) => shift.startHour,
    endHour: (shift) => shift.endHour,
    breaks: (shift) => getShiftBreaks(shift.id),
  },
  WeekSchedule: {
    monday: (schedule) =>
      schedule.mondayShiftId ? getShiftById(schedule.mondayShiftId) : null,
    tuesday: (schedule) =>
      schedule.tuesdayShiftId ? getShiftById(schedule.tuesdayShiftId) : null,
    wednesday: (schedule) =>
      schedule.wednesdayShiftId
        ? getShiftById(schedule.wednesdayShiftId)
        : null,
    thursday: (schedule) =>
      schedule.thursdayShiftId ? getShiftById(schedule.thursdayShiftId) : null,
    friday: (schedule) =>
      schedule.fridayShiftId ? getShiftById(schedule.fridayShiftId) : null,
    saturday: (schedule) =>
      schedule.saturdayShiftId ? getShiftById(schedule.saturdayShiftId) : null,
    sunday: (schedule) =>
      schedule.sundayShiftId ? getShiftById(schedule.sundayShiftId) : null,
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
