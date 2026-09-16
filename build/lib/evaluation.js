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
var evaluation_exports = {};
__export(evaluation_exports, {
  evaluateLimit: () => evaluateLimit,
  getFunctionProfiles: () => getFunctionProfiles,
  getWatchStatus: () => getWatchStatus,
  isUpdateTimedOut: () => isUpdateTimedOut
});
module.exports = __toCommonJS(evaluation_exports);
function getFunctionProfiles(devices, preferred) {
  const profiles = {};
  const add = (watched) => {
    if (watched.function) {
      profiles[watched.function] = {
        warning: { ...watched.warning },
        alarm: { ...watched.alarm },
        staleWarning: { ...watched.staleWarning }
      };
    }
  };
  for (const device of devices) {
    for (const watched of device.states) {
      add(watched);
    }
  }
  if (preferred) {
    add(preferred);
  }
  return profiles;
}
function evaluateLimit(value, limit) {
  if (!limit.enabled || typeof value !== "number" || !Number.isFinite(value)) {
    return false;
  }
  if (limit.mode === "below") {
    return limit.min !== void 0 && value < limit.min;
  }
  if (limit.mode === "above") {
    return limit.max !== void 0 && value > limit.max;
  }
  if (limit.min === void 0 || limit.max === void 0) {
    return false;
  }
  return limit.mode === "outside" ? value < limit.min || value > limit.max : value >= limit.min && value <= limit.max;
}
function getWatchStatus(value, warning, alarm, stale = false) {
  if (stale) {
    return "timeout";
  }
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "unknown";
  }
  if (evaluateLimit(value, alarm)) {
    return "alarm";
  }
  if (evaluateLimit(value, warning)) {
    return "warning";
  }
  return "ok";
}
function isUpdateTimedOut(state, configuration, now = Date.now()) {
  return Boolean(
    configuration.enabled && configuration.minutes > 0 && state && now - state.ts >= configuration.minutes * 6e4
  );
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  evaluateLimit,
  getFunctionProfiles,
  getWatchStatus,
  isUpdateTimedOut
});
//# sourceMappingURL=evaluation.js.map
