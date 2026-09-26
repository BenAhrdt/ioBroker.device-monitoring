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
  highestNotificationCategory: () => highestNotificationCategory,
  notificationCategoryForEvent: () => notificationCategoryForEvent,
  notificationCategoryForLevel: () => notificationCategoryForLevel,
  notificationCategoryForStatus: () => notificationCategoryForStatus,
  notificationCategoryForTransition: () => notificationCategoryForTransition,
  notificationLevelStateForCategory: () => notificationLevelStateForCategory,
  notificationTransitionsForSnapshots: () => notificationTransitionsForSnapshots
});
module.exports = __toCommonJS(notifications_exports);
const NOTIFICATION_CATEGORIES = [
  "deviceWarning",
  "deviceAlarm",
  "deviceTimeout",
  "invalidSource",
  "invalidValue",
  "deviceRecovered"
];
const GENERAL_NOTIFICATION_CATEGORIES = ["info", "warnung", "alarm"];
const DEFAULT_OUTPUT_NOTIFICATION_CATEGORIES = {
  deviceWarning: "warnung",
  deviceAlarm: "alarm",
  deviceTimeout: "alarm",
  invalidSource: "warnung",
  invalidValue: "warnung",
  deviceRecovered: "info"
};
function notificationCategoryForEvent(category) {
  return DEFAULT_OUTPUT_NOTIFICATION_CATEGORIES[category];
}
function notificationCategoryForStatus(status) {
  switch (status) {
    case "alarm":
    case "timeout":
      return "alarm";
    case "warning":
    case "invalid":
    case "invalidValue":
      return "warnung";
    default:
      return "info";
  }
}
function highestNotificationCategory(categories) {
  return categories.reduce(
    (highest, category) => categoryPriority(category) > categoryPriority(highest) ? category : highest,
    "info"
  );
}
function categoryPriority(category) {
  switch (category) {
    case "alarm":
      return 3;
    case "warnung":
      return 2;
    case "info":
      return 1;
  }
}
function problemCategoryForStatus(status) {
  switch (status) {
    case "warning":
      return "deviceWarning";
    case "alarm":
      return "deviceAlarm";
    case "timeout":
      return "deviceTimeout";
    case "invalid":
      return "invalidSource";
    case "invalidValue":
      return "invalidValue";
    default:
      return void 0;
  }
}
function recoveryCauseForStatus(status) {
  if (status === "warning" || status === "alarm") {
    return "limit";
  }
  if (status === "invalid" || status === "invalidValue") {
    return "invalid";
  }
  return void 0;
}
function notificationTransitionsForSnapshots(previous, current) {
  const transitions = [];
  const timeoutStarted = !previous.timedOut && current.timedOut;
  const timeoutEnded = previous.timedOut && !current.timedOut;
  if (timeoutStarted) {
    transitions.push({ category: "deviceTimeout" });
    return transitions;
  }
  if (timeoutEnded) {
    transitions.push({ category: "deviceRecovered", recoveryCause: "timeout" });
    const currentProblem2 = problemCategoryForStatus(current.underlyingStatus);
    if (currentProblem2 && currentProblem2 !== "deviceTimeout") {
      transitions.push({ category: currentProblem2 });
      return transitions;
    }
    const previousRecoveryCause2 = recoveryCauseForStatus(previous.underlyingStatus);
    if (previousRecoveryCause2) {
      transitions.push({ category: "deviceRecovered", recoveryCause: previousRecoveryCause2 });
    }
    return transitions;
  }
  if (current.timedOut) {
    return transitions;
  }
  if (previous.underlyingStatus === current.underlyingStatus && previous.status === current.status) {
    return transitions;
  }
  const currentProblem = problemCategoryForStatus(current.underlyingStatus);
  if (currentProblem) {
    if (recoveryCauseForStatus(previous.underlyingStatus) === "invalid" && (currentProblem === "deviceWarning" || currentProblem === "deviceAlarm")) {
      transitions.push({ category: "deviceRecovered", recoveryCause: "invalid" });
    }
    transitions.push({ category: currentProblem });
    return transitions;
  }
  const previousRecoveryCause = recoveryCauseForStatus(previous.underlyingStatus);
  if (previousRecoveryCause) {
    transitions.push({ category: "deviceRecovered", recoveryCause: previousRecoveryCause });
  }
  return transitions;
}
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
    case "invalidValue":
      return "invalidValue";
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
  if (current === "invalidValue") {
    return "invalidValue";
  }
  if (current === "ok" && ["warning", "alarm", "timeout", "invalid", "invalidValue"].includes(previous)) {
    return "deviceRecovered";
  }
  return void 0;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  GENERAL_NOTIFICATION_CATEGORIES,
  NOTIFICATION_CATEGORIES,
  highestNotificationCategory,
  notificationCategoryForEvent,
  notificationCategoryForLevel,
  notificationCategoryForStatus,
  notificationCategoryForTransition,
  notificationLevelStateForCategory,
  notificationTransitionsForSnapshots
});
//# sourceMappingURL=notifications.js.map
