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
var state_suggestions_exports = {};
__export(state_suggestions_exports, {
  monitoredSourceSuggestions: () => monitoredSourceSuggestions,
  sourceHierarchy: () => sourceHierarchy,
  sourceParentId: () => sourceParentId,
  suggestStateName: () => suggestStateName,
  suggestTargetDevice: () => suggestTargetDevice,
  translatedObjectName: () => translatedObjectName
});
module.exports = __toCommonJS(state_suggestions_exports);
function translatedObjectName(value, fallback) {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }
  if (value && typeof value === "object") {
    const translations = value;
    for (const language of ["de", "en", "ru"]) {
      if (typeof translations[language] === "string" && translations[language].trim()) {
        return translations[language].trim();
      }
    }
    const first = Object.values(translations).find((item) => typeof item === "string" && item.trim());
    if (typeof first === "string") {
      return first.trim();
    }
  }
  return fallback;
}
function sourceParentId(sourceId) {
  const separator = sourceId.lastIndexOf(".");
  return separator > 0 ? sourceId.slice(0, separator) : "";
}
function sourceHierarchy(sourceId, objects) {
  var _a, _b, _c, _d;
  const parts = sourceId.split(".");
  let channelId = "";
  let deviceId = "";
  for (let length = parts.length - 1; length > 0; length--) {
    const parentId = parts.slice(0, length).join(".");
    const object = objects[parentId];
    if ((object == null ? void 0 : object.type) === "channel" && !channelId) {
      channelId = parentId;
    }
    if ((object == null ? void 0 : object.type) === "device" && !deviceId) {
      deviceId = parentId;
    }
    if (channelId && deviceId) {
      break;
    }
  }
  return {
    parentId: sourceParentId(sourceId),
    channelId,
    deviceId,
    channelName: channelId ? translatedObjectName((_b = (_a = objects[channelId]) == null ? void 0 : _a.common) == null ? void 0 : _b.name, "") : "",
    deviceName: deviceId ? translatedObjectName((_d = (_c = objects[deviceId]) == null ? void 0 : _c.common) == null ? void 0 : _d.name, "") : ""
  };
}
function monitoredSourceSuggestions(devices, objects) {
  return devices.flatMap(
    (device) => device.states.map((state) => ({
      sourceId: state.sourceId,
      deviceId: device.id,
      name: state.name.trim(),
      hierarchy: sourceHierarchy(state.sourceId, objects)
    }))
  );
}
function suggestStateName(sourceId, stateObjectName, monitoredSources) {
  var _a;
  const existing = (_a = monitoredSources.find((source) => source.sourceId === sourceId)) == null ? void 0 : _a.name;
  if (existing) {
    return existing;
  }
  const fallback = sourceId.split(".").pop() || sourceId;
  return translatedObjectName(stateObjectName, fallback);
}
function uniqueDeviceId(sources) {
  const deviceIds = [...new Set(sources.map((source) => source.deviceId).filter(Boolean))];
  return deviceIds.length === 1 ? deviceIds[0] : void 0;
}
function configuredDeviceByName(name, devices) {
  const normalized = name.trim().toLocaleLowerCase();
  return normalized ? devices.find((device) => device.name.trim().toLocaleLowerCase() === normalized) : void 0;
}
function suggestTargetDevice(sourceId, objects, monitoredSources, devices) {
  const hierarchy = sourceHierarchy(sourceId, objects);
  const exact = uniqueDeviceId(monitoredSources.filter((source) => source.sourceId === sourceId));
  if (exact) {
    return exact;
  }
  const sameChannel = hierarchy.channelId ? uniqueDeviceId(monitoredSources.filter((source) => source.hierarchy.channelId === hierarchy.channelId)) : void 0;
  if (sameChannel) {
    return sameChannel;
  }
  const sameDevice = hierarchy.deviceId ? uniqueDeviceId(monitoredSources.filter((source) => source.hierarchy.deviceId === hierarchy.deviceId)) : void 0;
  if (sameDevice) {
    return sameDevice;
  }
  const sameParent = hierarchy.parentId ? uniqueDeviceId(monitoredSources.filter((source) => source.hierarchy.parentId === hierarchy.parentId)) : void 0;
  if (sameParent) {
    return sameParent;
  }
  const sourceDevice = configuredDeviceByName(hierarchy.deviceName, devices);
  if (sourceDevice) {
    return sourceDevice.id;
  }
  const sourceChannel = configuredDeviceByName(hierarchy.channelName, devices);
  if (sourceChannel) {
    return sourceChannel.id;
  }
  if (hierarchy.deviceName) {
    return hierarchy.deviceName;
  }
  if (hierarchy.channelName) {
    return hierarchy.channelName;
  }
  return devices.length === 1 ? devices[0].id : "";
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  monitoredSourceSuggestions,
  sourceHierarchy,
  sourceParentId,
  suggestStateName,
  suggestTargetDevice,
  translatedObjectName
});
//# sourceMappingURL=state-suggestions.js.map
