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
  createFunctionTemplate: () => createFunctionTemplate,
  evaluateLimit: () => evaluateLimit,
  getWatchStatus: () => getWatchStatus,
  isUpdateTimedOut: () => isUpdateTimedOut,
  parseAbsoluteChange: () => parseAbsoluteChange,
  parseFiniteNumber: () => parseFiniteNumber,
  parsePercentage: () => parsePercentage
});
module.exports = __toCommonJS(evaluation_exports);
function parseFiniteNumber(value) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : void 0;
  }
  if (typeof value !== "string" || !value.trim()) {
    return void 0;
  }
  const parsed = Number(value.trim().replace(",", "."));
  return Number.isFinite(parsed) ? parsed : void 0;
}
function parsePercentage(value) {
  const parsed = parseFiniteNumber(value);
  return parsed !== void 0 && parsed >= 0 ? parsed : void 0;
}
function parseAbsoluteChange(value) {
  const parsed = parseFiniteNumber(value);
  return parsed !== void 0 && parsed >= 0 ? parsed : void 0;
}
function createFunctionTemplate(watched) {
  return {
    warning: { ...watched.warning },
    alarm: { ...watched.alarm },
    staleWarning: { ...watched.staleWarning }
  };
}
function evaluateLimit(value, limit, previousValue) {
  if (!limit.enabled) {
    return false;
  }
  if (limit.mode === "percentage" || limit.mode === "absolute") {
    if (typeof value !== "number" || !Number.isFinite(value) || typeof previousValue !== "number" || !Number.isFinite(previousValue) || limit.mode === "percentage" && previousValue === 0) {
      return false;
    }
    const change = limit.mode === "percentage" ? (value - previousValue) / Math.abs(previousValue) * 100 : value - previousValue;
    if (change > 0) {
      return limit.positiveChangeEnabled === true && (limit.mode === "percentage" ? limit.positiveChangePercent : limit.positiveChangeValue) !== void 0 && change >= (limit.mode === "percentage" ? limit.positiveChangePercent : limit.positiveChangeValue);
    }
    if (change < 0) {
      return limit.negativeChangeEnabled === true && (limit.mode === "percentage" ? limit.negativeChangePercent : limit.negativeChangeValue) !== void 0 && -change >= (limit.mode === "percentage" ? limit.negativeChangePercent : limit.negativeChangeValue);
    }
    return false;
  }
  if (typeof value === "boolean") {
    return limit.booleanValue !== void 0 && value === limit.booleanValue;
  }
  if (typeof value !== "number" || !Number.isFinite(value)) {
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
function getWatchStatus(value, warning, alarm, stale = false, activation, now = Date.now()) {
  if (stale) {
    return "timeout";
  }
  if ((typeof value !== "number" || !Number.isFinite(value)) && typeof value !== "boolean") {
    return "invalidValue";
  }
  if (isLimitActive(value, alarm, activation == null ? void 0 : activation.alarmSince, now, activation == null ? void 0 : activation.alarmPercentageViolation)) {
    return "alarm";
  }
  if (isLimitActive(value, warning, activation == null ? void 0 : activation.warningSince, now, activation == null ? void 0 : activation.warningPercentageViolation)) {
    return "warning";
  }
  return "ok";
}
function isLimitActive(value, limit, since, now, changeViolation = false) {
  if (!limit.enabled) {
    return false;
  }
  const changeMode = limit.mode === "percentage" || limit.mode === "absolute";
  if (!changeMode && !evaluateLimit(value, limit)) {
    return false;
  }
  if (changeMode) {
    if (typeof value !== "number" || !Number.isFinite(value) || !changeViolation) {
      return false;
    }
  }
  const responseDelayMinutes = limit.responseDelayMinutes;
  if (typeof responseDelayMinutes !== "number" || !Number.isFinite(responseDelayMinutes) || responseDelayMinutes <= 0) {
    return true;
  }
  return typeof since === "number" && now - since >= responseDelayMinutes * 6e4;
}
function isUpdateTimedOut(state, configuration, now = Date.now()) {
  return Boolean(
    configuration.enabled && configuration.minutes > 0 && state && now - state.ts >= configuration.minutes * 6e4
  );
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  createFunctionTemplate,
  evaluateLimit,
  getWatchStatus,
  isUpdateTimedOut,
  parseAbsoluteChange,
  parseFiniteNumber,
  parsePercentage
});
//# sourceMappingURL=evaluation.js.map
