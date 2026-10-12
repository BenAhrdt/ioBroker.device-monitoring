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
  BATTERY_FUNCTION: () => BATTERY_FUNCTION,
  INDICATOR_ALARM_FUNCTION: () => INDICATOR_ALARM_FUNCTION,
  INDICATOR_MAINTENANCE_FUNCTION: () => INDICATOR_MAINTENANCE_FUNCTION,
  applyFunctionTemplate: () => applyFunctionTemplate,
  createDefaultFunctionTemplates: () => createDefaultFunctionTemplates,
  createFunctionTemplate: () => createFunctionTemplate,
  defaultFunctionForRole: () => defaultFunctionForRole,
  evaluateLimit: () => evaluateLimit,
  getWatchStatus: () => getWatchStatus,
  isUpdateTimedOut: () => isUpdateTimedOut,
  migrateStandardFunctionName: () => migrateStandardFunctionName,
  migrateStandardFunctionTemplates: () => migrateStandardFunctionTemplates,
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
const BATTERY_FUNCTION = "value.battery (standard)";
const INDICATOR_ALARM_FUNCTION = "indicator.alarm (standard)";
const INDICATOR_MAINTENANCE_FUNCTION = "indicator.maintenance (standard)";
const LEGACY_STANDARD_FUNCTION_NAMES = {
  "Battery and Intervall": BATTERY_FUNCTION,
  "Battery and Intervall (standard)": BATTERY_FUNCTION,
  "Indicator Error": INDICATOR_ALARM_FUNCTION,
  "Indicator Error (standard)": INDICATOR_ALARM_FUNCTION,
  "Indicator Alarm (standard)": INDICATOR_ALARM_FUNCTION,
  "Indicator Maintenance (standard)": INDICATOR_MAINTENANCE_FUNCTION
};
function migrateStandardFunctionName(name) {
  return LEGACY_STANDARD_FUNCTION_NAMES[name] || name;
}
function migrateStandardFunctionTemplates(templates) {
  const migrated = { ...templates };
  for (const [legacyName, currentName] of Object.entries(LEGACY_STANDARD_FUNCTION_NAMES)) {
    if (migrated[legacyName]) {
      if (!migrated[currentName]) {
        migrated[currentName] = migrated[legacyName];
      }
      delete migrated[legacyName];
    }
  }
  const batteryTemplate = migrated[BATTERY_FUNCTION];
  if ((batteryTemplate == null ? void 0 : batteryTemplate.alarm) && batteryTemplate.alarm.enabled === false && batteryTemplate.alarm.mode === "outside" && batteryTemplate.alarm.min === void 0 && batteryTemplate.alarm.max === void 0) {
    migrated[BATTERY_FUNCTION] = {
      ...batteryTemplate,
      alarm: { ...batteryTemplate.alarm, enabled: true, mode: "below", min: 10 }
    };
  }
  return migrated;
}
function createDefaultFunctionTemplates() {
  const inactiveLimit = () => ({
    enabled: false,
    mode: "outside",
    booleanValue: true,
    positiveChangeEnabled: true,
    negativeChangeEnabled: false
  });
  return {
    [BATTERY_FUNCTION]: {
      warning: { ...inactiveLimit(), enabled: true, mode: "below", min: 15 },
      alarm: { ...inactiveLimit(), enabled: true, mode: "below", min: 10 },
      staleWarning: { enabled: true, minutes: 15 }
    },
    [INDICATOR_ALARM_FUNCTION]: {
      warning: inactiveLimit(),
      alarm: { ...inactiveLimit(), enabled: true, booleanValue: true },
      staleWarning: { enabled: false, minutes: 60 }
    },
    [INDICATOR_MAINTENANCE_FUNCTION]: {
      warning: { ...inactiveLimit(), enabled: true, booleanValue: true },
      alarm: inactiveLimit(),
      staleWarning: { enabled: false, minutes: 60 }
    }
  };
}
function defaultFunctionForRole(role) {
  switch (role.trim().toLocaleLowerCase()) {
    case "value.battery":
      return BATTERY_FUNCTION;
    case "indicator.alarm":
      return INDICATOR_ALARM_FUNCTION;
    case "indicator.maintenance":
      return INDICATOR_MAINTENANCE_FUNCTION;
    default:
      return "";
  }
}
function createFunctionTemplate(watched) {
  return {
    warning: { ...watched.warning },
    alarm: { ...watched.alarm },
    staleWarning: { ...watched.staleWarning }
  };
}
function applyFunctionTemplate(watched, template) {
  return {
    ...watched,
    warning: { ...template.warning },
    alarm: { ...template.alarm },
    staleWarning: { ...template.staleWarning }
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
  BATTERY_FUNCTION,
  INDICATOR_ALARM_FUNCTION,
  INDICATOR_MAINTENANCE_FUNCTION,
  applyFunctionTemplate,
  createDefaultFunctionTemplates,
  createFunctionTemplate,
  defaultFunctionForRole,
  evaluateLimit,
  getWatchStatus,
  isUpdateTimedOut,
  migrateStandardFunctionName,
  migrateStandardFunctionTemplates,
  parseAbsoluteChange,
  parseFiniteNumber,
  parsePercentage
});
//# sourceMappingURL=evaluation.js.map
