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
  NOTIFICATION_CATEGORIES: () => NOTIFICATION_CATEGORIES,
  notificationCategoryForTransition: () => notificationCategoryForTransition
});
module.exports = __toCommonJS(notifications_exports);
const NOTIFICATION_CATEGORIES = [
  "deviceWarning",
  "deviceAlarm",
  "deviceTimeout",
  "invalidSource",
  "deviceRecovered"
];
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
  NOTIFICATION_CATEGORIES,
  notificationCategoryForTransition
});
//# sourceMappingURL=notifications.js.map
