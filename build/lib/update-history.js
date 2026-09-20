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
var update_history_exports = {};
__export(update_history_exports, {
  UPDATE_HISTORY_SIZE: () => UPDATE_HISTORY_SIZE,
  averageInterval: () => averageInterval,
  intervalDisplay: () => intervalDisplay,
  parseUpdateHistory: () => parseUpdateHistory,
  parseValueHistory: () => parseValueHistory,
  timeWeightedAverage: () => timeWeightedAverage
});
module.exports = __toCommonJS(update_history_exports);
const UPDATE_HISTORY_SIZE = 10;
function intervalDisplay(milliseconds) {
  const seconds = Math.max(0, Math.round(milliseconds / 1e3));
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor(seconds % 86400 / 3600);
  const minutes = Math.floor(seconds % 3600 / 60);
  const restSeconds = seconds % 60;
  return [
    days && `${days}d`,
    hours && `${hours}h`,
    minutes && `${minutes}m`,
    !days && !hours && !minutes || restSeconds ? `${restSeconds}s` : ""
  ].filter(Boolean).join(" ");
}
function parseUpdateHistory(value) {
  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter((timestamp) => typeof timestamp === "number" && Number.isFinite(timestamp) && timestamp > 0).sort((a, b) => a - b).filter((timestamp, index, timestamps) => index === 0 || timestamp !== timestamps[index - 1]).slice(-UPDATE_HISTORY_SIZE);
  } catch {
    return [];
  }
}
function parseValueHistory(value) {
  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    if (!Array.isArray(parsed)) {
      return [];
    }
    const byTimestamp = /* @__PURE__ */ new Map();
    for (const entry of parsed) {
      if (typeof entry === "object" && entry !== null && typeof entry.timestamp === "number" && Number.isFinite(entry.timestamp) && entry.timestamp > 0 && typeof entry.value === "number" && Number.isFinite(entry.value)) {
        byTimestamp.set(entry.timestamp, { timestamp: entry.timestamp, value: entry.value });
      }
    }
    return [...byTimestamp.values()].sort((a, b) => a.timestamp - b.timestamp).slice(-UPDATE_HISTORY_SIZE);
  } catch {
    return [];
  }
}
function averageInterval(timestamps) {
  if (timestamps.length < 2) {
    return null;
  }
  return (timestamps[timestamps.length - 1] - timestamps[0]) / (timestamps.length - 1);
}
function timeWeightedAverage(samples, maxGapMilliseconds) {
  if (samples.length < 2) {
    return null;
  }
  let weightedSum = 0;
  let totalDuration = 0;
  for (let index = 1; index < samples.length; index++) {
    const previous = samples[index - 1];
    const current = samples[index];
    const duration = current.timestamp - previous.timestamp;
    if (duration <= 0 || maxGapMilliseconds !== void 0 && duration > maxGapMilliseconds) {
      continue;
    }
    weightedSum += (previous.value + current.value) / 2 * duration;
    totalDuration += duration;
  }
  return totalDuration > 0 ? weightedSum / totalDuration : null;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  UPDATE_HISTORY_SIZE,
  averageInterval,
  intervalDisplay,
  parseUpdateHistory,
  parseValueHistory,
  timeWeightedAverage
});
//# sourceMappingURL=update-history.js.map
