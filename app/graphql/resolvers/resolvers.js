import { GraphQLError } from "graphql";
import {
  assignScheduleToResource,
  createResource,
  deleteAlternativeShift,
  assignAlternativeShiftToResource,
  deleteResource,
  updateResource,
} from "./mutation/resource.js";
import {
  getResources,
  getResource,
  getResourcesWithoutGroup,
} from "./query/resource.js";
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
import {
  getOrders,
  getOrdersByResource,
  getOrdersByResourceGroup,
  getOrdersByResourceId,
} from "./query/order.js";
import {
  getResourceGroups,
  getResourceGroup,
  getResourceLinksByGroupId,
  getOrdersByResourceGroupId,
} from "./query/resourceGroup.js";
import {
  createResourceGroup,
  updateResourceGroup,
  deleteResourceGroup,
  addResourcesToGroup,
  removeResourceFromGroup,
  removeAllResourcesFromGroup,
} from "./mutation/resourceGroup.js";
import { getAttribute, getAttributes } from "./query/attribute.js";
import {
  getChangeoverGroups,
  getChangeoverGroup,
  getChangeoverTimes,
  getChangeoverDataMatrix,
} from "./query/changeover.js";
import {
  createAttribute,
  updateAttribute,
  deleteAttribute,
  createAttrParam,
  deleteAttrParam,
} from "./mutation/attribute.js";
import {
  createChangeoverGroup,
  updateChangeoverGroup,
  deleteChangeoverGroup,
  setChangeoverTime,
  setChangeoverData,
  deleteChangeoverTime,
} from "./mutation/changeover.js";

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
    getResourcesWithoutGroup: () => getResourcesWithoutGroup(),
    //RESOURCE GROUP QUERIES
    getResourceGroups: () => getResourceGroups(),
    getResourceGroup: async (_, { id }) => {
      const resourceGroup = await getResourceGroup(id);
      if (!resourceGroup) {
        throw notFoundError("Resource group not found");
      }
      return resourceGroup;
    },
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
    //ORDER QUERIES
    orders: () => getOrders(),
    ordersByResource: async (_, { resourceId }) =>
      getOrdersByResource(resourceId),
    ordersByResourceGroup: async (_, { resourceGroupId }) =>
      getOrdersByResourceGroup(resourceGroupId),

    //ATTRIBUTE QUERIES
    getAttributes: () => getAttributes(),
    getAttribute: (_, { id }) => getAttribute(id),

    // CHANGEOVER QUERIES
    getChangeoverGroups: () => getChangeoverGroups(),
    getChangeoverGroup: (_, { id }) => getChangeoverGroup(id),
    getChangeoverTimes: (_, { changeoverGroupId }) =>
      getChangeoverTimes(changeoverGroupId),
    getChangeoverDataMatrix: (_, { changeoverGroupId, attributeId }) =>
      getChangeoverDataMatrix(changeoverGroupId, attributeId),
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
    //RESOURCE GROUP MUTATIONS
    createResourceGroup: async (_, { input }) => createResourceGroup({ input }),
    updateResourceGroup: async (_, { input }) => updateResourceGroup({ input }),
    deleteResourceGroup: async (_, { id }) => deleteResourceGroup({ id }),
    addResourcesToGroup: async (_, { resourceIds, resourceGroupId }) =>
      addResourcesToGroup({ resourceIds, resourceGroupId }),
    removeResourceFromGroup: async (_, { resourceId, resourceGroupId }) =>
      removeResourceFromGroup({ resourceId, resourceGroupId }),
    removeAllResourcesFromGroup: async (_, { resourceGroupId }) =>
      removeAllResourcesFromGroup({ resourceGroupId }),
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
    // ATTRIBUTE MUTATIONS
    createAttribute: (_, { input }) => createAttribute({ input }),
    updateAttribute: (_, { id, input }) => updateAttribute({ id, input }),
    deleteAttribute: (_, { id }) => deleteAttribute({ id }),
    createAttrParam: (_, { input }) => createAttrParam({ input }),
    deleteAttrParam: (_, { id }) => deleteAttrParam({ id }),

    // CHANGEOVER MUTATIONS
    createChangeoverGroup: (_, { name }) => createChangeoverGroup({ name }),
    updateChangeoverGroup: (_, { id, name }) =>
      updateChangeoverGroup({ id, name }),
    deleteChangeoverGroup: (_, { id }) => deleteChangeoverGroup({ id }),

    // UPSERT MUTATIONS
    setChangeoverTime: (_, { input }) => setChangeoverTime({ input }),
    deleteChangeoverTime: async (_, { id }) => deleteChangeoverTime({ id }),
    setChangeoverData: (_, { input }) => setChangeoverData({ input }),
  },
  Resource: {
    schedule: (resource) =>
      resource.scheduleId ? getScheduleById(resource.scheduleId) : null,
    alternativeShifts: (resource) => getAlternativeShifts(resource.id),
    orders: (resource) => getOrdersByResourceId(resource.id),
  },
  ResourceGroup: {
    resourceLinks: (resourceGroup) =>
      getResourceLinksByGroupId(resourceGroup.id),
    orders: (resourceGroup) => getOrdersByResourceGroupId(resourceGroup.id),
  },
  ResourceToGroup: {
    resource: (link) => link.resource,
    resourceGroup: (link) => link.resourceGroup,
  },
  Order: {
    resource: (order) => order.resource,
    resourceGroup: (order) => order.resourceGroup,
  },
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
  Attribute: {
    attributeParameters: (parent) => {
      // If already included in parent query (eager loaded), return it
      if (parent.attributeParameters) return parent.attributeParameters;
      // Otherwise fetch using helper
      return getAttributeParameters(parent.id);
    },
  },

  ChangeoverGroup: {
    changeoverTimes: (parent) => {
      return getChangeoverTimes(parent.id);
    },
  },

  ChangeoverTime: {
    attribute: (parent) => getAttribute(parent.attributeId),
    changeoverGroup: (parent) => getChangeoverGroup(parent.changeoverGroupId),
  },

  ChangeoverData: {
    fromAttributeParameter: (parent) => getAttrParam(parent.fromAttrParamId),
    toAttributeParameter: (parent) => getAttrParam(parent.toAttrParamId),
  },
};

const notFoundError = (message) =>
  new GraphQLError(message, {
    extensions: {
      code: "NOT_FOUND",
    },
  });
