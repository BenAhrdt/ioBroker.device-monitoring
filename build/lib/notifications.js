"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var notifications_exports = {};
__export(notifications_exports, {
  GENERAL_NOTIFICATION_CATEGORIES: () => GENERAL_NOTIFICATION_CATEGORIES,
  NOTIFICATION_CATEGORIES: () => NOTIFICATION_CATEGORIES,
  notificationCategoryForLevel: () => notificationCategoryForLevel,
  notificationCategoryForTransition: () => notificationCategoryForTransition,
  notificationLevelStateForCategory: () => notificationLevelStateForCategory
});
module.exports = __toCommonJS(notifications_exports);
const NOTIFICATION_CATEGORIES = [
  "deviceWarning",
  "deviceAlarm",
  "deviceTimeout",
  "invalidSource",
  "deviceRecovered"
];
const GENERAL_NOTIFICATION_CATEGORIES = ["info", "warnung", "alarm"];
function notificationLevelStateForCategory(category) {
  switch (category) {
    case "deviceWarning":
      return "warning";
    case "deviceAlarm":
      return "alarm";
    case "deviceTimeout":
      return "timeout";
    case "deviceRecovered":
      return "recovered";
    case "invalidSource":
      return "invalid";
  }
}
function notificationCategoryForLevel(level, defaultCategory) {
  switch (level) {
    case 1:
      return void 0;
    case 2:
      return "info";
    case 3:
      return "warnung";
    case 4:
      return "alarm";
    default:
      return defaultCategory;
  }
}
function notificationCategoryForTransition(previous, current) {
  if (previous === current) {
    return void 0;
  }
  if (current === "warning") {
    return "deviceWarning";
  }
  if (current === "alarm") {
    return "deviceAlarm";
  }
  if (current === "timeout") {
    return "deviceTimeout";
  }
  if (current === "invalid") {
    return "invalidSource";
  }
  if (current === "ok" && ["warning", "alarm", "timeout", "invalid"].includes(previous)) {
    return "deviceRecovered";
  }
  return void 0;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  GENERAL_NOTIFICATION_CATEGORIES,
  NOTIFICATION_CATEGORIES,
  notificationCategoryForLevel,
  notificationCategoryForTransition,
  notificationLevelStateForCategory
});
//# sourceMappingURL=notifications.js.map
