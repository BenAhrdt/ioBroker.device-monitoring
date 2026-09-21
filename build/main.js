"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var utils = __toESM(require("@iobroker/adapter-core"));
var import_dm_utils = require("@iobroker/dm-utils");
var import_evaluation = require("./lib/evaluation");
var import_configuration_backup = require("./lib/configuration-backup");
var import_notifications = require("./lib/notifications");
var import_update_history = require("./lib/update-history");
const t = (en, de) => ({ en, de });
const COLORS = {
  invalid: "#6d4c41",
  timeout: "#1976d2",
  alarm: "#c62828",
  warning: "#d6a500",
  ok: "#3f7d45",
  unknown: "#607d8b"
};
const svgIcon = (content) => `data:image/svg+xml,${encodeURIComponent(content)}`;
const STATUS_ICONS = {
  invalid: svgIcon(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#6d4c41"/><path d="M8.2 8.2l7.6 7.6M9.2 14.8l-1.4 1.4a2.8 2.8 0 01-4-4l2.4-2.4a2.8 2.8 0 014 0M14.8 9.2l1.4-1.4a2.8 2.8 0 014 4l-2.4 2.4a2.8 2.8 0 01-4 0" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round"/></svg>'
  ),
  timeout: svgIcon(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#1976d2"/><circle cx="12" cy="12" r="5.7" fill="none" stroke="white" stroke-width="1.8"/><path d="M12 8.4v4l2.8 1.7" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  ),
  ok: svgIcon(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#2e9d38"/><path d="M7 12.5l3.1 3.1L17.5 8" fill="none" stroke="white" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  ),
  warning: svgIcon(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#e6a700"/><path d="M12 6.4l6.1 10.7H5.9L12 6.4z" fill="white"/><path d="M12 9.3v4.2" stroke="#b77900" stroke-width="1.8" stroke-linecap="round"/><circle cx="12" cy="15.6" r="1" fill="#b77900"/></svg>'
  ),
  alarm: svgIcon(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#d62828"/><path d="M12 6.8v7" stroke="white" stroke-width="2.5" stroke-linecap="round"/><circle cx="12" cy="17.2" r="1.35" fill="white"/></svg>'
  ),
  unknown: svgIcon(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#607d8b"/><path d="M9.5 9a2.7 2.7 0 115 1.4c-.8 1.2-2.5 1.4-2.5 3" fill="none" stroke="white" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="17" r="1.2" fill="white"/></svg>'
  )
};
const LEGACY_RUNTIME_STATE_IDS = [
  "value",
  "status",
  "display",
  "warning",
  "alarm",
  "updateTimeout",
  "lastUpdate",
  "previousUpdate",
  "updateInterval",
  "lastUpdateDisplay",
  "previousUpdateDisplay",
  "updateIntervalDisplay",
  "averageUpdateInterval",
  "averageUpdateIntervalDisplay",
  "updateHistory",
  "updateHistorySource"
];
const OBSOLETE_DIRECT_STATE_IDS = [
  "display",
  "lastUpdate",
  "previousUpdate",
  "updateInterval",
  "lastUpdateDisplay",
  "previousUpdateDisplay",
  "updateIntervalDisplay",
  "averageUpdateInterval",
  "averageUpdateIntervalDisplay",
  "updateHistory",
  "updateHistorySource",
  "details"
];
const OBSOLETE_DATA_STATE_IDS = ["value", "status", "warning", "alarm", "updateTimeout"];
const DEVICE_CARD_DETAILS_ID = "__card_details";
const NOTIFICATION_LEVEL_STATE_NAMES = {
  warning: t("Warning", "Warnung"),
  alarm: t("Alarm", "Alarm"),
  timeout: t("Timeout", "Timeout"),
  recovered: t("Recovered", "Wiederhergestellt"),
  invalid: t("Invalid source", "Ung\xFCltige Quelle")
};
function isNotificationLevelValue(value) {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 4;
}
const DEFAULT_MESSAGE_TEMPLATES = {
  warning: {
    en: "State {{state}} on device {{device}} violated its configured warning condition ({{warningLimits}}) with {{value}} {{unit}}. ({{remark}})",
    de: "Der State {{state}} vom Ger\xE4t {{device}} hat mit {{value}} {{unit}} die konfigurierte Warngrenze ({{warningLimits}}) verletzt ({{remark}})"
  },
  alarm: {
    en: "State {{state}} on device {{device}} violated its configured alarm condition ({{alarmLimits}}) with {{value}} {{unit}}. ({{remark}})",
    de: "Der State {{state}} vom Ger\xE4t {{device}} hat mit {{value}} {{unit}} die konfigurierte Alarmgrenze ({{alarmLimits}}) verletzt ({{remark}})"
  },
  timeout: {
    en: "State {{state}} on device {{device}} has not reported for at least {{timeoutMinutes}} minutes. Last update: {{lastUpdate}} ({{remark}})",
    de: "Der State {{state}} vom Ger\xE4t {{device}} hat sich mindestens {{timeoutMinutes}} Minuten nicht gemeldet. Letzte Aktualisierung: {{lastUpdate}} ({{remark}})"
  },
  invalidSource: {
    en: "Invalid or deleted source for {{device}} / {{state}}: {{sourceId}} ({{remark}})",
    de: "Ung\xFCltige oder gel\xF6schte Quelle bei {{device}} / {{state}}: {{sourceId}} ({{remark}})"
  },
  recovered: {
    en: "{{device}} / {{state}} is back to normal: {{value}} {{unit}} ({{remark}})",
    de: "{{device}} / {{state}} ist wieder in Ordnung: {{value}} {{unit}} ({{remark}})"
  }
};
const DEFAULT_NOTIFICATION_TITLE_TEMPLATES = {
  warning: { en: "Warning: {{device}} - {{state}}", de: "Warnung: {{device}} - {{state}}" },
  alarm: { en: "Alarm: {{device}} - {{state}}", de: "Alarm: {{device}} - {{state}}" },
  timeout: { en: "Update timeout: {{device}} - {{state}}", de: "Aktualisierungs-Timeout: {{device}} - {{state}}" },
  invalidSource: {
    en: "Invalid or deleted source: {{device}} - {{state}}",
    de: "Ung\xFCltige oder gel\xF6schte Quelle: {{device}} - {{state}}"
  },
  recovered: {
    en: "Device recovered: {{device}} - {{state}}",
    de: "Ger\xE4t wieder in Ordnung: {{device}} - {{state}}"
  }
};
const LEGACY_DEFAULT_MESSAGE_TEMPLATES = {
  warning: [
    "Warnung bei {{device}} / {{state}}: {{value}} {{unit}}",
    "Warning at {{device}} / {{state}}: {{value}} {{unit}}",
    "Warnung bei {{device}} / {{state}}: {{value}} {{unit}} (Grenze: {{warningLimits}})",
    "Warning at {{device}} / {{state}}: {{value}} {{unit}} (limit: {{warningLimits}})"
  ],
  alarm: [
    "Alarm bei {{device}} / {{state}}: {{value}} {{unit}}",
    "Alarm at {{device}} / {{state}}: {{value}} {{unit}}",
    "Alarm bei {{device}} / {{state}}: {{value}} {{unit}} (Grenze: {{alarmLimits}})",
    "Alarm at {{device}} / {{state}}: {{value}} {{unit}} (limit: {{alarmLimits}})"
  ],
  timeout: [
    "Keine Aktualisierung bei {{device}} / {{state}} seit {{timeoutMinutes}} Minuten. Letzter Wert: {{value}} {{unit}} (letzte Aktualisierung: {{lastUpdate}})",
    "No update at {{device}} / {{state}} for {{timeoutMinutes}} minutes. Last value: {{value}} {{unit}} (last update: {{lastUpdate}})"
  ],
  invalidSource: [
    "Ung\xFCltige oder gel\xF6schte Quelle bei {{device}} / {{state}}: {{sourceId}}",
    "Invalid or deleted source for {{device}} / {{state}}: {{sourceId}}"
  ],
  recovered: [
    "{{device}} / {{state}} ist wieder in Ordnung: {{value}} {{unit}}",
    "{{device}} / {{state}} is back to normal: {{value}} {{unit}}"
  ]
};
const LEGACY_DEFAULT_NOTIFICATION_TITLE_TEMPLATES = {
  warning: ["Warnung: {{device}} / {{state}}"],
  alarm: ["Alarm: {{device}} / {{state}}"],
  timeout: ["Aktualisierungs-Timeout: {{device}} / {{state}}"],
  invalidSource: ["Ung\xFCltige oder gel\xF6schte Quelle: {{device}} / {{state}}"],
  recovered: ["Ger\xE4t wieder in Ordnung: {{device}} / {{state}}"]
};
function renderMessageTemplate(template, values) {
  var _a;
  const remark = ((_a = values.remark) == null ? void 0 : _a.trim()) || "";
  const templateWithoutEmptyRemark = remark ? template : template.replace(/[ \t]*\(\s*\{\{\s*remark\s*\}\}\s*\)/g, "");
  return templateWithoutEmptyRemark.replace(/\{\{\s*([a-zA-Z][a-zA-Z0-9_]*)\s*\}\}/g, (placeholder, key) => {
    var _a2;
    return (_a2 = values[key]) != null ? _a2 : placeholder;
  }).replace(/[ \t]{2,}/g, " ").trim();
}
function safeId(value, fallback) {
  return value.trim().toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9_-]+/g, "_").replace(/^_+|_+$/g, "") || fallback;
}
function uniqueId(base, used) {
  let id = base;
  let i = 2;
  while (used.has(id)) {
    id = `${base}_${i++}`;
  }
  return id;
}
function timestampDisplay(timestamp) {
  const date = new Date(timestamp);
  const pad = (value, length = 2) => String(value).padStart(length, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${pad(date.getMilliseconds(), 3)}`;
}
function escapeHtml(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
const supportedSourceType = (value) => {
  if (value === "number") {
    return "number";
  }
  if (value === "boolean" || value === "bool") {
    return "boolean";
  }
  return void 0;
};
const translatedObjectName = (value, fallback) => {
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
};
class DeviceMonitoringManagement extends import_dm_utils.DeviceManagement {
  constructor(adapter) {
    super(adapter, true);
  }
  async refreshCards() {
    await this.sendCommandToGui({ command: "all" });
  }
  getInstanceInfo() {
    return {
      apiVersion: "v3",
      communicationStateId: "info.deviceManager",
      actions: [
        {
          id: "addDevice",
          icon: "add",
          title: t("+ Add device", "+ Ger\xE4t hinzuf\xFCgen"),
          variant: "contained",
          style: { backgroundColor: "#455a64", color: "#fff" },
          handler: async (context) => {
            const data = await context.showForm(deviceForm(), {
              title: t("Add device", "Ger\xE4t hinzuf\xFCgen"),
              data: { name: "" },
              buttons: ["apply", "cancel"]
            });
            if (!(data == null ? void 0 : data.name)) {
              return { refresh: false };
            }
            await this.adapter.addDevice(String(data.name));
            return { refresh: true };
          }
        },
        {
          id: "addStatesByFilter",
          icon: "search",
          title: t("Search and add states", "States suchen & hinzuf\xFCgen"),
          variant: "contained",
          style: { backgroundColor: "#455a64", color: "#fff", marginLeft: "8px" },
          handler: async (context) => {
            var _a;
            const candidates = await this.adapter.getStateCandidates();
            const filter = await context.showForm(stateSearchForm(candidates), {
              title: t("Search states", "States suchen"),
              data: { role: "", roleCustom: "", name: "", id: "", type: "", includeExisting: false },
              buttons: ["apply", "cancel"]
            });
            if (!filter) {
              return { refresh: false };
            }
            const matching = filterStateCandidates(candidates, filter);
            if (!matching.length) {
              await context.showMessage(
                t(
                  "No states match the selected filters.",
                  "Keine States entsprechen den gesetzten Filtern."
                )
              );
              return { refresh: false };
            }
            const devices = this.adapter.getDeviceOptions();
            const defaultData = defaultBulkStateForm(matching, devices);
            const selectionToken = this.adapter.createBulkSelectionSession(defaultData);
            let data;
            try {
              data = await context.showForm(
                bulkStateForm(
                  matching,
                  devices,
                  this.adapter.getFunctionTemplates(),
                  this.adapter.getFunctionNames(),
                  selectionToken
                ),
                {
                  title: t("Select states to add", "States zum Hinzuf\xFCgen ausw\xE4hlen"),
                  data: defaultData,
                  buttons: ["apply", "cancel"],
                  applyDisabledRule: bulkStateDisabledRule(this.adapter.getDeviceConfigurations())
                }
              );
            } finally {
              this.adapter.removeBulkSelectionSession(selectionToken);
            }
            if (!data) {
              return { refresh: false };
            }
            const rows = Array.isArray(data.states) ? data.states : [];
            const targetText = (value) => {
              var _a2;
              if (typeof value === "string") {
                return value.trim();
              }
              if (value && typeof value === "object") {
                const option = value;
                const optionValue = (_a2 = option.value) != null ? _a2 : option.label;
                return typeof optionValue === "string" ? optionValue.trim() : "";
              }
              return "";
            };
            const selectedTypes = rows.filter((row) => (row == null ? void 0 : row.selected) === true).map((row) => String(row.type || ""));
            const mixedSelection = selectedTypes.includes("number") && selectedTypes.includes("boolean");
            const selected = rows.filter((row) => (row == null ? void 0 : row.selected) === true).map((row, index) => ({
              row,
              candidate: matching.find((candidate) => candidate.id === String(row.sourceId || "").trim()) || matching[index]
            })).filter(({ candidate }) => !!candidate).map(({ row, candidate }) => {
              const typeSettings = candidate.type === "boolean" ? {
                warning: mixedSelection ? data.booleanWarning || data.warning : data.warning,
                alarm: mixedSelection ? data.booleanAlarm || data.alarm : data.alarm
              } : {
                warning: mixedSelection ? data.numberWarning || data.warning : data.warning,
                alarm: mixedSelection ? data.numberAlarm || data.alarm : data.alarm
              };
              return {
                ...data,
                ...typeSettings,
                name: String(row.name || candidate.name).trim(),
                remark: String(row.remark || "").trim(),
                sourceId: candidate.id,
                sourceType: candidate.type,
                targetDevice: row.targetDevice
              };
            });
            if (!selected.length) {
              await context.showMessage(
                t("Select at least one state.", "Bitte mindestens einen State ausw\xE4hlen.")
              );
              return { refresh: false };
            }
            const selectedWithoutTarget = selected.filter((entry) => !targetText(entry.targetDevice));
            if (selectedWithoutTarget.length) {
              await context.showMessage(
                t(
                  "Choose a target device for every selected state.",
                  "Bitte f\xFCr jeden ausgew\xE4hlten State ein Zielger\xE4t ausw\xE4hlen oder eingeben."
                )
              );
              return { refresh: false };
            }
            const targetGroups = /* @__PURE__ */ new Map();
            for (const entry of selected) {
              const target = targetText(entry.targetDevice);
              const existing = devices.find((device) => device.id === target) || devices.find((device) => device.name.trim().toLowerCase() === target.toLowerCase());
              const key = existing ? `id:${existing.id}` : `new:${target.toLowerCase()}`;
              const group = targetGroups.get(key) || { target, targetId: existing == null ? void 0 : existing.id, entries: [] };
              group.entries.push(entry);
              targetGroups.set(key, group);
            }
            for (const group of targetGroups.values()) {
              const names = group.entries.map((entry) => String(entry.name).trim().toLocaleLowerCase());
              const existingNames = new Set(
                (group.targetId ? ((_a = this.adapter.getDeviceConfiguration(group.targetId)) == null ? void 0 : _a.states) || [] : []).map((state) => state.name.trim().toLocaleLowerCase())
              );
              if (names.some((name) => !name) || names.some((name, index) => names.indexOf(name) !== index) || names.some((name) => existingNames.has(name))) {
                await context.showMessage(
                  t(
                    "Display names must be unique within each target device.",
                    "Die Anzeigenamen m\xFCssen innerhalb jedes Zielger\xE4ts eindeutig sein."
                  )
                );
                return { refresh: false };
              }
            }
            for (const group of targetGroups.values()) {
              if (!group.targetId) {
                group.targetId = await this.adapter.addDevice(group.target);
              }
              await this.adapter.addWatchedStates(group.targetId, group.entries);
            }
            const targetIds = [...targetGroups.values()].map((group) => group.targetId).filter((targetId2) => !!targetId2);
            const hasNewDevice = [...targetGroups.values()].some(
              (group) => !devices.some((device) => device.id === group.targetId)
            );
            if (hasNewDevice || targetIds.length !== 1) {
              return { refresh: "devices" };
            }
            const targetId = targetIds[0];
            if (!targetId) {
              throw new Error("The target device could not be resolved");
            }
            const update = this.updatedDeviceInfo(targetId);
            await this.sendCommandToGui({ command: "infoUpdate", deviceId: targetId, info: update });
            return { update };
          }
        }
      ]
    };
  }
  async loadDevices(context) {
    const devices = await this.adapter.getDevicesWithStatus();
    context.setTotalDevices(devices.length);
    for (const entry of devices) {
      context.addDevice(this.deviceInfo(entry.device));
    }
  }
  deviceInfo(device) {
    const actions = [
      {
        id: "addState",
        icon: "add",
        description: t("Add monitored state", "\xDCberwachungs-State hinzuf\xFCgen"),
        handler: async (_id, context) => {
          const sourceTypes = await this.adapter.getValidSourceTypes();
          const validSourceIds = Object.keys(sourceTypes);
          const data = await context.showForm(
            stateForm(
              this.adapter.getFunctionTemplates(),
              this.adapter.getFunctionNames(),
              device.states,
              void 0
            ),
            {
              title: t("Add monitored state", "\xDCberwachungs-State hinzuf\xFCgen"),
              data: defaultStateForm(validSourceIds, sourceTypes),
              buttons: ["apply", "cancel"],
              applyDisabledRule: addStateDisabledRule(device.states)
            }
          );
          if (!(data == null ? void 0 : data.sourceId) || !(data == null ? void 0 : data.name)) {
            return { refresh: "none" };
          }
          await this.adapter.addWatchedState(device.id, data);
          const update = this.updatedDeviceInfo(device.id);
          await this.sendCommandToGui({ command: "infoUpdate", deviceId: device.id, info: update });
          return { update };
        }
      }
    ];
    if (device.states.length) {
      actions.push({
        id: "editStates",
        icon: "settings",
        description: t("Edit monitored states", "\xDCberwachungs-States bearbeiten"),
        handler: async (_deviceId, context) => {
          const sourceTypes = await this.adapter.getValidSourceTypes();
          const validSourceIds = Object.keys(sourceTypes);
          const formData = {
            _validSourceIds: validSourceIds,
            _sourceTypes: sourceTypes,
            ...Object.fromEntries(
              device.states.map((watched) => [
                watched.id,
                {
                  ...watched,
                  warning: {
                    ...watched.warning,
                    booleanValue: watched.warning.booleanValue === false ? "false" : "true"
                  },
                  alarm: {
                    ...watched.alarm,
                    booleanValue: watched.alarm.booleanValue === false ? "false" : "true"
                  }
                }
              ])
            )
          };
          const data = await context.showForm(
            statesForm(device.states, this.adapter.getFunctionTemplates(), this.adapter.getFunctionNames()),
            {
              title: t("Edit monitored states", "\xDCberwachungs-States bearbeiten"),
              data: formData,
              buttons: ["apply", "cancel"],
              applyDisabledRule: editStatesDisabledRule(device.states)
            }
          );
          if (!data) {
            return { refresh: "none" };
          }
          await this.adapter.replaceWatchedStates(device.id, data);
          return { update: this.updatedDeviceInfo(device.id) };
        }
      });
    }
    actions.push(
      {
        id: "rename",
        icon: "edit",
        description: t("Rename device", "Ger\xE4t umbenennen"),
        handler: async (_id, context) => {
          const data = await context.showForm(deviceForm(), {
            title: t("Rename device", "Ger\xE4t umbenennen"),
            data: { name: device.name },
            buttons: ["apply", "cancel"]
          });
          if (!(data == null ? void 0 : data.name)) {
            return { refresh: "none" };
          }
          await this.adapter.renameDevice(device.id, String(data.name));
          return { refresh: "devices" };
        }
      },
      {
        id: "delete",
        icon: "delete",
        color: "secondary",
        description: t("Delete device", "Ger\xE4t l\xF6schen"),
        confirmation: t("Delete this device?", "Dieses Ger\xE4t l\xF6schen?"),
        handler: async () => {
          await this.adapter.removeDevice(device.id);
          return { refresh: "devices" };
        }
      }
    );
    return {
      id: device.id,
      name: device.name,
      icon: { stateId: `${this.adapter.namespace}.devices.${device.id}.icon` },
      backgroundColor: { stateId: `${this.adapter.namespace}.devices.${device.id}.color` },
      customInfo: {
        id: device.id,
        schema: {
          type: "panel",
          style: { marginTop: "-56px" },
          items: {
            _cardDetails: {
              type: "state",
              oid: `devices.${device.id}.${DEVICE_CARD_DETAILS_ID}.details`,
              control: "html",
              label: "",
              newLine: true,
              xs: 12
            }
          }
        }
      },
      actions
    };
  }
  updatedDeviceInfo(deviceId) {
    const device = this.adapter.getDeviceConfiguration(deviceId);
    return device ? this.deviceInfo(device) : { id: deviceId, name: deviceId };
  }
}
function deviceForm() {
  return {
    type: "panel",
    items: { name: { type: "text", label: t("Device name", "Ger\xE4tename"), newLine: true, xs: 12 } }
  };
}
function defaultLimit(mode) {
  return { enabled: false, mode, booleanValue: true };
}
function defaultFormLimit(mode) {
  return { ...defaultLimit(mode), booleanValue: "true" };
}
function defaultStateForm(validSourceIds, sourceTypes) {
  return {
    name: "",
    sourceId: "",
    remark: "",
    _validSourceIds: validSourceIds,
    _sourceTypes: sourceTypes,
    function: "",
    warning: defaultFormLimit("outside"),
    alarm: defaultFormLimit("outside"),
    staleWarning: { enabled: false, minutes: 60 }
  };
}
function stateSearchForm(candidates) {
  const roles = [...new Set(candidates.map((candidate) => candidate.role).filter(Boolean))].sort();
  const types = [
    .../* @__PURE__ */ new Set(["number", "boolean", ...candidates.map((candidate) => candidate.type).filter(Boolean)])
  ].sort();
  return {
    type: "panel",
    items: {
      role: {
        type: "select",
        label: t("Existing role", "Vorhandene Rolle"),
        options: [
          { value: "", label: "Alle Rollen / All roles" },
          ...roles.map((value) => ({ value, label: value }))
        ],
        noTranslation: true,
        newLine: true,
        xs: 12,
        help: t(
          "Select a role from the list or use the custom field below.",
          "Rolle aus der Liste w\xE4hlen oder das freie Feld darunter verwenden."
        )
      },
      roleCustom: {
        type: "text",
        label: t("Custom role or role search text", "Eigene Rolle oder Rollen-Suchtext"),
        newLine: true,
        xs: 12,
        help: t("Example: value.battery", "Beispiel: value.battery"),
        placeholder: "value.battery"
      },
      name: {
        type: "text",
        label: t("Name contains", "Name enth\xE4lt"),
        xs: 12
      },
      id: {
        type: "text",
        label: t("State ID contains", "State-ID enth\xE4lt"),
        xs: 12
      },
      type: {
        type: "select",
        label: t("Data type", "Datentyp"),
        options: [
          { value: "", label: t("All types", "Alle Datentypen") },
          ...types.map((value) => ({ value, label: value === "boolean" ? "boolean / bool" : value }))
        ],
        noTranslation: true,
        xs: 12
      },
      includeExisting: {
        type: "checkbox",
        label: t("Include already monitored states", "Bereits \xFCberwachte States einschlie\xDFen"),
        newLine: true,
        xs: 12
      }
    }
  };
}
function filterStateCandidates(candidates, filter) {
  const textValue = (value) => {
    if (typeof value === "string") {
      return value;
    }
    if (value && typeof value === "object") {
      const option = value;
      return typeof option.value === "string" ? option.value : typeof option.label === "string" ? option.label : "";
    }
    return "";
  };
  const includes = (value, search) => {
    const normalizedSearch = textValue(search).trim().toLocaleLowerCase();
    return !normalizedSearch || value.toLocaleLowerCase().includes(normalizedSearch);
  };
  const selectedRole = textValue(filter.roleCustom).trim() || textValue(filter.role).trim();
  const selectedType = textValue(filter.type).trim();
  return candidates.filter(
    (candidate) => includes(candidate.role, selectedRole) && includes(candidate.name, filter.name) && includes(candidate.id, filter.id) && (!selectedType || candidate.type === selectedType) && (filter.includeExisting === true || !candidate.alreadyAdded)
  );
}
function defaultBulkStateForm(candidates, devices) {
  return {
    states: candidates.map((candidate) => {
      var _a;
      return {
        selected: !candidate.alreadyAdded,
        name: candidate.name,
        remark: "",
        sourceId: candidate.id,
        role: candidate.role || "\u2014",
        type: candidate.type || "\u2014",
        targetDevice: ((_a = devices[0]) == null ? void 0 : _a.id) || ""
      };
    }),
    function: "",
    _saveAsTemplate: false,
    warning: defaultFormLimit("outside"),
    alarm: defaultFormLimit("outside"),
    numberWarning: defaultFormLimit("outside"),
    numberAlarm: defaultFormLimit("outside"),
    booleanWarning: defaultFormLimit("outside"),
    booleanAlarm: defaultFormLimit("outside"),
    staleWarning: { enabled: false, minutes: 60 }
  };
}
function bulkStateForm(candidates, devices, functionTemplates, functionNames, selectionToken) {
  const hasSelectedNumber = "Array.isArray(data.states) && data.states.some(row => row && row.selected === true && String(row.type || '') === 'number')";
  const hasSelectedBoolean = "Array.isArray(data.states) && data.states.some(row => row && row.selected === true && String(row.type || '') === 'boolean')";
  const mixedSource = `(${hasSelectedNumber}) && (${hasSelectedBoolean})`;
  const numberOnlySource = `(${hasSelectedNumber}) && !(${hasSelectedBoolean})`;
  const booleanOnlySource = `(${hasSelectedBoolean}) && !(${hasSelectedNumber})`;
  const selectionHiddenDependsOn = [{ attr: "states" }];
  const settings = stateForm(
    functionTemplates,
    functionNames,
    [],
    void 0,
    "number",
    booleanOnlySource,
    numberOnlySource,
    mixedSource,
    selectionHiddenDependsOn
  ).items;
  delete settings.name;
  delete settings.sourceId;
  settings.function.hidden = mixedSource;
  settings.function.hiddenDependsOn = selectionHiddenDependsOn;
  settings._saveAsTemplate.hidden = mixedSource;
  settings._saveAsTemplate.hiddenDependsOn = selectionHiddenDependsOn;
  const mixedSettings = {
    mixedSettingsHeader: {
      type: "staticText",
      text: t(
        "Different state types selected: configure numeric and boolean states separately.",
        "Unterschiedliche State-Typen ausgew\xE4hlt: Zahlen- und Boolean-States getrennt konfigurieren."
      ),
      newLine: true,
      xs: 12,
      hidden: `!(${mixedSource})`,
      hiddenDependsOn: selectionHiddenDependsOn,
      style: { fontWeight: 700, marginTop: "8px" }
    },
    ...bulkTypeLimitFields("number", "warning", mixedSource, selectionHiddenDependsOn),
    ...bulkTypeLimitFields("number", "alarm", mixedSource, selectionHiddenDependsOn),
    ...bulkTypeLimitFields("boolean", "warning", mixedSource, selectionHiddenDependsOn),
    ...bulkTypeLimitFields("boolean", "alarm", mixedSource, selectionHiddenDependsOn)
  };
  const orderedSettings = {};
  for (const [name, item] of Object.entries(settings)) {
    if (name === "staleWarningHeader") {
      Object.assign(orderedSettings, mixedSettings);
    }
    orderedSettings[name] = item;
  }
  for (const name of Object.keys(settings)) {
    delete settings[name];
  }
  Object.assign(settings, orderedSettings);
  const selectionJsonData = (action) => `{"token":${JSON.stringify(selectionToken)},"action":${JSON.stringify(action)},"form":\${JSON.stringify(data)}}`;
  return {
    type: "panel",
    items: {
      selectAll: {
        type: "sendto",
        label: t("Select all", "Alle ausw\xE4hlen"),
        xs: 6,
        newLine: true,
        command: "bulkStateSelection",
        jsonData: selectionJsonData("all"),
        variant: "contained",
        useNative: true
      },
      clearSelection: {
        type: "sendto",
        label: t("Clear selection", "Auswahl aufheben"),
        xs: 6,
        command: "bulkStateSelection",
        jsonData: selectionJsonData("none"),
        variant: "outlined",
        icon: "delete",
        useNative: true
      },
      statesHeader: {
        type: "staticText",
        text: t(
          `Select states, target devices, display names and remarks (${candidates.length} matches)`,
          `States, Zielger\xE4te, Anzeigenamen und Bemerkungen anpassen (${candidates.length} Treffer)`
        ),
        newLine: true,
        xs: 12,
        style: { fontWeight: 700, marginTop: "8px" }
      },
      states: {
        type: "table",
        items: [
          { type: "checkbox", attr: "selected", title: t("Add", "Hinzuf\xFCgen"), width: "8%" },
          {
            type: "text",
            attr: "name",
            title: t("Display name", "Anzeigename"),
            width: "17%"
          },
          {
            type: "text",
            attr: "sourceId",
            title: "State-ID",
            disabled: true,
            width: "25%"
          },
          {
            type: "text",
            attr: "remark",
            title: t("Remark", "Bemerkung"),
            width: "16%"
          },
          {
            type: "autocomplete",
            attr: "targetDevice",
            title: t("Target device", "Zielger\xE4t"),
            options: devices.map((device) => ({ value: device.id, label: device.name })),
            freeSolo: true,
            noTranslation: true,
            width: "20%"
          },
          {
            type: "text",
            attr: "role",
            title: t("Role", "Rolle"),
            disabled: true,
            width: "8%"
          },
          {
            type: "text",
            attr: "type",
            title: t("Type", "Typ"),
            disabled: true,
            width: "6%"
          }
        ],
        noDelete: true,
        compact: true,
        useCardFor: ["xs", "sm"],
        newLine: true,
        xs: 12
      },
      ...settings
    }
  };
}
function bulkStateDisabledRule(devices) {
  const existingNames = Object.fromEntries(
    devices.map((device) => [device.id, device.states.map((state) => state.name.trim().toLocaleLowerCase())])
  );
  const targetAliases = Object.fromEntries(
    devices.flatMap((device) => [
      [device.id.toLocaleLowerCase(), device.id],
      [device.name.trim().toLocaleLowerCase(), device.id]
    ])
  );
  return `(() => { const rows = Array.isArray(data.states) ? data.states.filter(row => row && row.selected) : []; const existingNames = ${JSON.stringify(existingNames)}; const targetAliases = ${JSON.stringify(targetAliases)}; const text = value => typeof value === 'string' ? value.trim() : (value && typeof value === 'object' ? String(value.value || value.label || '').trim() : ''); const groups = {}; for (const row of rows) { const target = text(row.targetDevice).toLocaleLowerCase(); const name = String(row.name || '').trim().toLocaleLowerCase(); if (!target || !name) return true; const key = targetAliases[target] || 'new:' + target; groups[key] ||= { names: [], existing: existingNames[key] || [] }; groups[key].names.push(name); } return !rows.length || Object.values(groups).some(group => group.names.some((name, index) => group.names.indexOf(name) !== index) || group.names.some(name => group.existing.includes(name))); })()`;
}
function stateForm(functionTemplates, functionNames, states, stateId, sourceTypeExpression, booleanSourceExpression, numericSourceExpression, mixedSourceExpression, hiddenDependsOn) {
  const functions = [.../* @__PURE__ */ new Set([...functionNames, ...Object.keys(functionTemplates)])].sort();
  const key = (path) => stateId ? `${stateId}.${path}` : path;
  const data = (path) => stateId ? `data[${JSON.stringify(stateId)}].${path}` : `data.${path}`;
  const selectedSourceType = sourceTypeExpression || `data._sourceTypes[String(${data("sourceId")} || '').trim()] || ''`;
  const mixedSource = mixedSourceExpression || `(${selectedSourceType}) === 'mixed'`;
  const booleanSource = booleanSourceExpression || `(${selectedSourceType}) === 'boolean'`;
  const numericSource = numericSourceExpression || `(${selectedSourceType}) === 'number'`;
  const gateSettingsUntilValidSource = !stateId && !sourceTypeExpression;
  const validSource = `Array.isArray(data._validSourceIds) && data._validSourceIds.includes(String(${data("sourceId")} || '').trim())`;
  const hideUntilValidSource = gateSettingsUntilValidSource ? `!(${validSource})` : void 0;
  const combineHidden = (condition) => hideUntilValidSource ? condition ? `${hideUntilValidSource} || (${condition})` : hideUntilValidSource : condition;
  const visibilityDependencies = hiddenDependsOn ? { hiddenDependsOn } : {};
  const existingNames = JSON.stringify(states.map((state) => state.name.trim().toLowerCase()));
  const otherStateIds = JSON.stringify(states.filter((state) => state.id !== stateId).map((state) => state.id));
  const nameValidator = stateId ? `return (${data("_delete")} || (() => { const name = String(${data("name")} || '').trim().toLowerCase(); return !!name && !${otherStateIds}.some(id => !data[id]?._delete && String(data[id]?.name || '').trim().toLowerCase() === name); })())` : `return (() => { const name = String(${data("name")} || '').trim().toLowerCase(); return !!name && !${existingNames}.includes(name); })()`;
  const sourceValidator = `return (${stateId ? `${data("_delete")} || ` : ""}(Array.isArray(data._validSourceIds) && data._validSourceIds.includes(String(${data("sourceId")} || '').trim())))`;
  const templates = JSON.stringify(functionTemplates);
  const templateValue = (path) => ({
    calculateFunc: path.endsWith("booleanValue") ? `(${templates}[${data("function")}] ? ((${templates}[${data("function")}].${path} === false || ${templates}[${data("function")}].${path} === 'false') ? 'false' : 'true') : ${data(path)})` : `(${templates}[${data("function")}] ? ${templates}[${data("function")}].${path} : ${data(path)})`,
    ignoreOwnChanges: true
  });
  const sectionHeader = (text, backgroundColor) => ({
    type: "staticText",
    text,
    newLine: true,
    xs: 12,
    style: {
      backgroundColor,
      color: "#fff",
      fontWeight: 700,
      borderRadius: "4px",
      padding: "8px"
    }
  });
  const limits = (prefix, label, color) => ({
    [key(`${prefix}Header`)]: {
      ...sectionHeader(label, color),
      hidden: combineHidden(mixedSource),
      ...visibilityDependencies
    },
    [key(`${prefix}.enabled`)]: {
      type: "checkbox",
      label: t("Enabled", "Aktiviert"),
      newLine: true,
      xs: 4,
      hidden: combineHidden(mixedSource),
      ...visibilityDependencies
    },
    [key(`${prefix}.mode`)]: {
      type: "select",
      label: t("Violation when value is \u2026", "Verletzung, wenn der Wert \u2026"),
      xs: 8,
      options: [
        { value: "below", label: t("below the limit", "unter dem Grenzwert liegt") },
        { value: "above", label: t("above the limit", "\xFCber dem Grenzwert liegt") },
        { value: "outside", label: t("outside the allowed range", "au\xDFerhalb des erlaubten Bereichs liegt") },
        { value: "inside", label: t("inside the forbidden range", "im verbotenen Bereich liegt") }
      ],
      hidden: combineHidden(`${data(`${prefix}.enabled`)} !== true || !(${numericSource}) || (${mixedSource})`),
      ...visibilityDependencies
    },
    [key(`${prefix}.booleanValue`)]: {
      type: "select",
      label: t("Violation when value is \u2026", "Verletzung, wenn der Wert \u2026"),
      options: [
        { value: "true", label: "true" },
        { value: "false", label: "false" }
      ],
      newLine: true,
      xs: 8,
      hidden: combineHidden(`${data(`${prefix}.enabled`)} !== true || !(${booleanSource}) || (${mixedSource})`),
      ...visibilityDependencies
    },
    [key(`${prefix}.min`)]: {
      type: "number",
      label: t("Lower limit", "Untergrenze"),
      step: 0.01,
      newLine: true,
      xs: 6,
      hidden: combineHidden(
        `${data(`${prefix}.enabled`)} !== true || !(${numericSource}) || (${mixedSource}) || ${data(`${prefix}.mode`)} === 'above'`
      ),
      ...visibilityDependencies
    },
    [key(`${prefix}.max`)]: {
      type: "number",
      label: t("Upper limit", "Obergrenze"),
      step: 0.01,
      xs: 6,
      hidden: combineHidden(
        `${data(`${prefix}.enabled`)} !== true || !(${numericSource}) || (${mixedSource}) || ${data(`${prefix}.mode`)} === 'below'`
      ),
      ...visibilityDependencies
    }
  });
  return {
    type: "panel",
    items: {
      [key("name")]: {
        type: "text",
        label: t("Name", "Name"),
        newLine: true,
        xs: 12,
        validator: nameValidator,
        validatorErrorText: t(
          "Name is required and must be unique within the device",
          "Der Name ist erforderlich und muss innerhalb des Ger\xE4ts eindeutig sein"
        ),
        validatorNoSaveOnError: true
      },
      [key("sourceId")]: {
        type: "objectId",
        label: t("ioBroker state", "ioBroker-State"),
        newLine: true,
        xs: 12,
        customFilter: { type: "state", common: { type: ["number", "boolean"] } },
        validator: sourceValidator,
        validatorErrorText: t(
          "Please select an existing number or boolean ioBroker state",
          "Bitte einen vorhandenen ioBroker-State vom Typ Zahl oder Boolean ausw\xE4hlen"
        ),
        validatorNoSaveOnError: true
      },
      ...!sourceTypeExpression ? {
        [key("remark")]: {
          type: "text",
          label: t("Remark", "Bemerkung"),
          help: t(
            "Optional note available as the {{remark}} notification-template placeholder.",
            "Optionale Bemerkung, die als Platzhalter {{remark}} in Benachrichtigungsvorlagen verwendet werden kann."
          ),
          hidden: hideUntilValidSource,
          newLine: true,
          xs: 12
        }
      } : {},
      [key("function")]: {
        type: "autocomplete",
        label: t("Function", "Funktion"),
        options: functions,
        freeSolo: true,
        onChangeDependsOn: [
          ...[
            "warning.enabled",
            "warning.mode",
            "warning.booleanValue",
            "warning.min",
            "warning.max",
            "alarm.enabled",
            "alarm.mode",
            "alarm.booleanValue",
            "alarm.min",
            "alarm.max",
            "staleWarning.enabled",
            "staleWarning.minutes"
          ].map((path) => ({ attr: key(path), onChange: templateValue(path) }))
        ],
        help: functions.length ? t(`Existing functions: ${functions.join(", ")}`, `Vorhandene Funktionen: ${functions.join(", ")}`) : void 0,
        hidden: hideUntilValidSource,
        newLine: true,
        xs: 12
      },
      [key("_saveAsTemplate")]: {
        type: "checkbox",
        label: t(
          "Save or update this selection as function template",
          "Diese Auswahl als Funktionsvorlage speichern oder aktualisieren"
        ),
        hidden: hideUntilValidSource,
        newLine: true,
        xs: 12
      },
      ...limits("warning", t("Warning limits", "Warngrenzen"), "#d6a500"),
      ...limits("alarm", t("Alarm limits", "Alarmgrenzen"), "#c62828"),
      [key("staleWarningHeader")]: {
        ...sectionHeader(t("Update timeout", "Aktualisierungs-Timeout"), "#1976d2"),
        hidden: hideUntilValidSource
      },
      [key("staleWarning.enabled")]: {
        type: "checkbox",
        label: t("Warn if the state is not updated", "Warnen, wenn der State nicht aktualisiert wird"),
        hidden: hideUntilValidSource,
        newLine: true,
        xs: 12
      },
      [key("staleWarning.minutes")]: {
        type: "number",
        label: t("Timeout in minutes", "Zeitlimit in Minuten"),
        min: 1,
        step: 1,
        newLine: true,
        xs: 12,
        hidden: combineHidden(`${data("staleWarning.enabled")} !== true`)
      }
    }
  };
}
function addStateDisabledRule(states) {
  const existingNames = JSON.stringify(states.map((state) => state.name.trim().toLowerCase()));
  return `!String(data.name || '').trim() || ${existingNames}.includes(String(data.name || '').trim().toLowerCase()) || !Array.isArray(data._validSourceIds) || !data._validSourceIds.includes(String(data.sourceId || '').trim())`;
}
function bulkTypeLimitFields(type, prefix, visible, hiddenDependsOn) {
  const visibilityDependencies = hiddenDependsOn ? { hiddenDependsOn } : {};
  const root = `${type}${prefix[0].toUpperCase()}${prefix.slice(1)}`;
  const color = prefix === "warning" ? "#d6a500" : "#c62828";
  const header = type === "number" ? prefix === "warning" ? t("Numeric warning limits", "Numerische Warngrenzen") : t("Numeric alarm limits", "Numerische Alarmgrenzen") : prefix === "warning" ? t("Boolean warning settings", "Boolesche Warneinstellungen") : t("Boolean alarm settings", "Boolesche Alarmeinstellungen");
  const fields = {
    [`${root}Header`]: {
      type: "staticText",
      text: header,
      newLine: true,
      xs: 12,
      hidden: `!(${visible})`,
      ...visibilityDependencies,
      style: {
        backgroundColor: color,
        color: "#fff",
        fontWeight: 700,
        borderRadius: "4px",
        padding: "8px"
      }
    },
    [`${root}.enabled`]: {
      type: "checkbox",
      label: t("Enabled", "Aktiviert"),
      newLine: true,
      xs: 4,
      hidden: `!(${visible})`,
      ...visibilityDependencies
    }
  };
  if (type === "number") {
    fields[`${root}.mode`] = {
      type: "select",
      label: t("Violation when value is \u2026", "Verletzung, wenn der Wert \u2026"),
      xs: 8,
      options: [
        { value: "below", label: t("below the limit", "unter dem Grenzwert liegt") },
        { value: "above", label: t("above the limit", "\xFCber dem Grenzwert liegt") },
        { value: "outside", label: t("outside the allowed range", "au\xDFerhalb des erlaubten Bereichs liegt") },
        { value: "inside", label: t("inside the forbidden range", "innerhalb des verbotenen Bereichs liegt") }
      ],
      hidden: `!(${visible}) || data.${root}.enabled !== true`,
      ...visibilityDependencies
    };
    fields[`${root}.min`] = {
      type: "number",
      label: t("Lower limit", "Untergrenze"),
      step: 0.01,
      newLine: true,
      xs: 6,
      hidden: `!(${visible}) || data.${root}.enabled !== true || data.${root}.mode === 'above'`,
      ...visibilityDependencies
    };
    fields[`${root}.max`] = {
      type: "number",
      label: t("Upper limit", "Obergrenze"),
      step: 0.01,
      xs: 6,
      hidden: `!(${visible}) || data.${root}.enabled !== true || data.${root}.mode === 'below'`,
      ...visibilityDependencies
    };
  } else {
    fields[`${root}.booleanValue`] = {
      type: "select",
      label: t("Violation when value is \u2026", "Verletzung, wenn der Wert \u2026"),
      options: [
        { value: "true", label: "true" },
        { value: "false", label: "false" }
      ],
      newLine: true,
      xs: 8,
      hidden: `!(${visible}) || data.${root}.enabled !== true`,
      ...visibilityDependencies
    };
  }
  return fields;
}
function editStatesDisabledRule(states) {
  const stateIds = JSON.stringify(states.map((state) => state.id));
  return `(() => { const ids = ${stateIds}; return !Array.isArray(data._validSourceIds) || ids.some(id => { const state = data[id]; if (!state || state._delete) return false; const name = String(state.name || '').trim().toLowerCase(); return !name || !data._validSourceIds.includes(String(state.sourceId || '').trim()) || ids.some(otherId => otherId !== id && !data[otherId]?._delete && String(data[otherId]?.name || '').trim().toLowerCase() === name); }); })()`;
}
function statesForm(states, functionTemplates, functionNames) {
  return {
    type: "tabs",
    items: Object.fromEntries(
      states.map((watched) => {
        const form = stateForm(functionTemplates, functionNames, states, watched.id);
        form.items[`${watched.id}._delete`] = {
          type: "checkbox",
          label: t("Delete this monitored state", "Diesen \xDCberwachungs-State l\xF6schen"),
          newLine: true,
          xs: 12
        };
        return [watched.id, { ...form, label: watched.name }];
      })
    )
  };
}
class DeviceMonitoring extends utils.Adapter {
  devices = [];
  functionTemplates = {};
  nextDeviceNumber = 1;
  subscribed = /* @__PURE__ */ new Set();
  notificationLevelSubscriptions = /* @__PURE__ */ new Set();
  invalidSources = /* @__PURE__ */ new Set();
  sourceUnits = /* @__PURE__ */ new Map();
  updateHistoryQueues = /* @__PURE__ */ new Map();
  notificationStatuses = /* @__PURE__ */ new Map();
  notificationLastSent = /* @__PURE__ */ new Map();
  messageWriteQueue = Promise.resolve();
  cardDetails = /* @__PURE__ */ new Map();
  cardDetailsQueues = /* @__PURE__ */ new Map();
  legacyRuntimeStatesRemoved = false;
  resetUpdateHistories = /* @__PURE__ */ new Set();
  displayLanguage = "en";
  deviceManagement;
  sortRefreshTimer;
  staleCheckTimer;
  configurationBackupTimer;
  bulkSelectionSessions = /* @__PURE__ */ new Map();
  constructor(options = {}) {
    super({ ...options, name: "device-monitoring" });
    this.on("ready", this.onReady.bind(this));
    this.on("stateChange", this.onStateChange.bind(this));
    this.on("objectChange", this.onObjectChange.bind(this));
    this.on("message", this.onMessage.bind(this));
    this.on("unload", (callback) => {
      if (this.sortRefreshTimer) {
        clearInterval(this.sortRefreshTimer);
      }
      if (this.staleCheckTimer) {
        clearInterval(this.staleCheckTimer);
      }
      if (this.configurationBackupTimer) {
        clearTimeout(this.configurationBackupTimer);
      }
      callback();
    });
  }
  async onReady() {
    var _a;
    const systemConfig = await this.getForeignObjectAsync("system.config");
    this.displayLanguage = ((_a = systemConfig == null ? void 0 : systemConfig.common) == null ? void 0 : _a.language) === "de" ? "de" : "en";
    await this.migrateNotificationTemplateDefaults();
    this.deviceManagement = new DeviceMonitoringManagement(this);
    const legacyDevices = this.normalizeDevices(this.config.devices);
    this.devices = legacyDevices.length ? legacyDevices : await this.loadDevicesFromObjects();
    if (!legacyDevices.length && !this.devices.length) {
      if (await this.restoreDeviceConfigurationBackup(false)) {
        this.log.info("Restored the device configuration from the instance backup");
      }
    }
    await this.ensureState("info.deviceInfo", t("Device information", "Ger\xE4teinformationen"), "string", "json");
    await this.ensureState(
      "info.message",
      t("Notification message", "Benachrichtigungsnachricht"),
      "string",
      "json"
    );
    await this.clearLegacyMessageState();
    await this.rebuildObjects();
    if (legacyDevices.length) {
      await this.removeLegacyDeviceConfig();
    }
    await this.refreshSubscriptions();
    await this.updateAll();
    await this.setState("info.connection", true, true);
    this.sortRefreshTimer = setInterval(() => {
      var _a2;
      void ((_a2 = this.deviceManagement) == null ? void 0 : _a2.refreshCards());
    }, 1e4);
    this.staleCheckTimer = setInterval(() => {
      void this.updateAll();
    }, 6e4);
    this.scheduleConfigurationBackup();
  }
  async clearLegacyMessageState() {
    const state = await this.getStateAsync("info.message");
    if (typeof (state == null ? void 0 : state.val) !== "string") {
      return;
    }
    try {
      const parsed = JSON.parse(state.val);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed) && !("messages" in parsed)) {
        return;
      }
    } catch {
    }
    await this.setStateChangedAsync("info.message", { val: "{}", ack: true });
  }
  async migrateNotificationTemplateDefaults() {
    var _a, _b;
    const instanceId = `system.adapter.${this.namespace}`;
    const instanceObject = await this.getForeignObjectAsync(instanceId);
    if (!instanceObject) {
      return;
    }
    const native = { ...instanceObject.native };
    const configKeys = {
      warning: { message: "warningMessageTemplate", title: "warningTitleTemplate" },
      alarm: { message: "alarmMessageTemplate", title: "alarmTitleTemplate" },
      timeout: { message: "timeoutMessageTemplate", title: "timeoutTitleTemplate" },
      invalidSource: { message: "invalidSourceMessageTemplate", title: "invalidSourceTitleTemplate" },
      recovered: { message: "recoveredMessageTemplate", title: "recoveredTitleTemplate" }
    };
    let changed = false;
    for (const type of Object.keys(configKeys)) {
      const { message, title } = configKeys[type];
      const configuredMessage = native[message];
      if (typeof configuredMessage !== "string" || !configuredMessage.trim() || ((_a = LEGACY_DEFAULT_MESSAGE_TEMPLATES[type]) == null ? void 0 : _a.includes(configuredMessage))) {
        native[message] = this.localize(DEFAULT_MESSAGE_TEMPLATES[type].en, DEFAULT_MESSAGE_TEMPLATES[type].de);
        changed = true;
      }
      const configuredTitle = native[title];
      if (typeof configuredTitle !== "string" || !configuredTitle.trim() || ((_b = LEGACY_DEFAULT_NOTIFICATION_TITLE_TEMPLATES[type]) == null ? void 0 : _b.includes(configuredTitle))) {
        native[title] = this.localize(
          DEFAULT_NOTIFICATION_TITLE_TEMPLATES[type].en,
          DEFAULT_NOTIFICATION_TITLE_TEMPLATES[type].de
        );
        changed = true;
      }
    }
    if (changed) {
      await this.setForeignObjectAsync(instanceId, { ...instanceObject, native });
    }
  }
  async onMessage(message) {
    var _a;
    if (message.command === "bulkStateSelection") {
      try {
        const request = typeof message.message === "string" ? JSON.parse(message.message) : message.message || {};
        const token = typeof request.token === "string" ? request.token : "";
        const action = request.action === "none" ? "none" : "all";
        const result = this.applyBulkSelection(token, action, request.form);
        this.sendTo(message.from, message.command, result, message.callback);
      } catch (error) {
        this.sendTo(message.from, message.command, { error: String(error) }, message.callback);
      }
      return;
    }
    if (message.command === "backupDeviceConfiguration") {
      try {
        const updated = await this.backupDeviceConfiguration();
        this.sendTo(
          message.from,
          message.command,
          { result: updated ? "backupUpdated" : "backupCurrent" },
          message.callback
        );
      } catch (error) {
        this.sendTo(message.from, message.command, { error: String(error) }, message.callback);
      }
      return;
    }
    if (message.command === "restoreDeviceConfiguration") {
      try {
        const restored = await this.restoreDeviceConfigurationBackup(true);
        this.sendTo(
          message.from,
          message.command,
          { result: restored ? "backupRestored" : "backupMissing" },
          message.callback
        );
      } catch (error) {
        this.sendTo(message.from, message.command, { error: String(error) }, message.callback);
      }
      return;
    }
    if (!((_a = message.command) == null ? void 0 : _a.startsWith("dm:"))) {
      this.log.debug(`Unhandled command: ${message.command}`);
    }
  }
  async onStateChange(id, state) {
    if (!state) {
      return;
    }
    const notificationLevelStateId = this.getNotificationLevelStateRelativeId(id);
    if (notificationLevelStateId) {
      if (state.ack === false && isNotificationLevelValue(state.val)) {
        await this.setStateAsync(notificationLevelStateId, { val: state.val, ack: true });
      }
      return;
    }
    const affectedDevices = /* @__PURE__ */ new Set();
    for (const device of this.devices) {
      for (const watched of device.states) {
        if (watched.sourceId === id) {
          await this.updateValue(device, watched, state);
          affectedDevices.add(device.id);
        }
      }
    }
    for (const deviceId of affectedDevices) {
      const device = this.devices.find((entry) => entry.id === deviceId);
      if (device) {
        await this.updateDeviceSummary(device);
      }
    }
    if (affectedDevices.size) {
      await this.updateDeviceInfo();
    }
  }
  getNotificationLevelStateRelativeId(id) {
    const namespacePrefix = `${this.namespace}.`;
    const relativeId = id.startsWith(namespacePrefix) ? id.slice(namespacePrefix.length) : id;
    for (const device of this.devices) {
      for (const watched of device.states) {
        const prefix = `devices.${device.id}.${watched.id}.level.`;
        if (!relativeId.startsWith(prefix)) {
          continue;
        }
        const levelId = relativeId.slice(prefix.length);
        if (Object.prototype.hasOwnProperty.call(NOTIFICATION_LEVEL_STATE_NAMES, levelId)) {
          return relativeId;
        }
      }
    }
    return void 0;
  }
  async onObjectChange(id, object) {
    var _a;
    if (!this.subscribed.has(id)) {
      return;
    }
    if (this.isValidSourceObject(object)) {
      this.invalidSources.delete(id);
      this.sourceUnits.set(id, typeof object.common.unit === "string" ? object.common.unit : "");
    } else {
      this.invalidSources.add(id);
      this.sourceUnits.delete(id);
    }
    const affectedDevices = /* @__PURE__ */ new Set();
    for (const device of this.devices) {
      for (const watched of device.states) {
        if (watched.sourceId === id) {
          const state = await this.getForeignStateAsync(id);
          await this.updateValue(device, watched, state);
          affectedDevices.add(device.id);
        }
      }
    }
    for (const deviceId of affectedDevices) {
      const device = this.devices.find((entry) => entry.id === deviceId);
      if (device) {
        await this.updateDeviceSummary(device);
      }
    }
    if (affectedDevices.size) {
      await this.updateDeviceInfo();
      await ((_a = this.deviceManagement) == null ? void 0 : _a.refreshCards());
    }
  }
  getFunctionTemplates() {
    return JSON.parse(JSON.stringify(this.functionTemplates));
  }
  localize(en, de) {
    return this.displayLanguage === "de" ? de : en;
  }
  getFunctionNames() {
    return [...new Set(this.devices.flatMap((device) => device.states.map((state) => state.function)).filter(Boolean))];
  }
  getDeviceConfigurations() {
    return this.devices.map((device) => ({
      ...device,
      states: device.states.map((state) => ({
        ...state,
        warning: { ...state.warning },
        alarm: { ...state.alarm },
        staleWarning: { ...state.staleWarning }
      }))
    }));
  }
  getDeviceOptions() {
    return this.devices.map((device) => ({ id: device.id, name: device.name }));
  }
  createBulkSelectionSession(data) {
    const token = `bulk_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    this.bulkSelectionSessions.set(token, JSON.parse(JSON.stringify(data)));
    setTimeout(() => this.bulkSelectionSessions.delete(token), 10 * 60 * 1e3);
    return token;
  }
  removeBulkSelectionSession(token) {
    this.bulkSelectionSessions.delete(token);
  }
  applyBulkSelection(token, action, form) {
    const session = this.bulkSelectionSessions.get(token);
    if (!session) {
      throw new Error("The bulk selection session has expired");
    }
    const current = form && typeof form === "object" ? JSON.parse(JSON.stringify(form)) : session;
    current.states = Array.isArray(current.states) ? current.states.map((row) => ({ ...row, selected: action === "all" })) : [];
    this.bulkSelectionSessions.set(token, current);
    return { native: current };
  }
  async getStateCandidates() {
    const objects = await this.getForeignObjectsAsync("*", "state");
    const monitoredSources = new Set(this.devices.flatMap((device) => device.states.map((state) => state.sourceId)));
    const usedNames = /* @__PURE__ */ new Map();
    return Object.entries(objects).filter(([, object]) => {
      var _a;
      return !!supportedSourceType((_a = object.common) == null ? void 0 : _a.type);
    }).map(([id, object]) => {
      var _a, _b, _c;
      const fallback = id.split(".").pop() || id;
      const baseName = translatedObjectName((_a = object.common) == null ? void 0 : _a.name, fallback);
      const key = baseName.toLocaleLowerCase();
      const occurrence = (usedNames.get(key) || 0) + 1;
      usedNames.set(key, occurrence);
      const name = occurrence === 1 ? baseName : `${baseName} (${occurrence})`;
      return {
        id,
        name,
        type: supportedSourceType((_b = object.common) == null ? void 0 : _b.type) || "",
        role: String(((_c = object.common) == null ? void 0 : _c.role) || ""),
        alreadyAdded: monitoredSources.has(id)
      };
    }).sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id));
  }
  getDeviceConfiguration(deviceId) {
    return this.devices.find((device) => device.id === deviceId);
  }
  async getDevicesWithStatus() {
    const rank = { invalid: 0, timeout: 1, alarm: 2, warning: 3, unknown: 4, ok: 5 };
    const result = await Promise.all(
      this.devices.map(async (device) => ({ device, status: await this.getDeviceStatus(device) }))
    );
    return result.sort((a, b) => rank[a.status] - rank[b.status] || a.device.name.localeCompare(b.device.name));
  }
  async addDevice(name) {
    const used = new Set(this.devices.map((device) => device.id));
    let id;
    do {
      id = `device_${String(this.nextDeviceNumber++).padStart(3, "0")}`;
    } while (used.has(id));
    await this.saveDevices([...this.devices, { id, name: name.trim(), states: [] }]);
    return id;
  }
  async renameDevice(id, name) {
    await this.saveDevices(this.devices.map((d) => d.id === id ? { ...d, name: name.trim() } : d));
  }
  async removeDevice(id) {
    await this.delObjectAsync(`devices.${id}`, { recursive: true });
    await this.saveDevices(this.devices.filter((d) => d.id !== id));
  }
  async addWatchedState(deviceId, data) {
    const device = this.devices.find((d) => d.id === deviceId);
    if (!device) {
      return;
    }
    const usedIds = /* @__PURE__ */ new Set([DEVICE_CARD_DETAILS_ID, ...device.states.map((s) => s.id)]);
    const id = uniqueId(safeId(String(data.name), "state"), usedIds);
    this.saveFunctionTemplate(data);
    await this.saveDevices(
      this.devices.map(
        (d) => d.id === deviceId ? { ...d, states: [...d.states, this.normalizeState(data, id)] } : d
      ),
      false
    );
  }
  async addWatchedStates(deviceId, entries) {
    const device = this.devices.find((d) => d.id === deviceId);
    if (!device || !entries.length) {
      return;
    }
    const usedIds = /* @__PURE__ */ new Set([DEVICE_CARD_DETAILS_ID, ...device.states.map((state) => state.id)]);
    const states = entries.map((entry) => {
      const id = uniqueId(safeId(String(entry.name), "state"), usedIds);
      usedIds.add(id);
      this.saveFunctionTemplate(entry);
      return this.normalizeState(entry, id);
    });
    await this.saveDevices(
      this.devices.map(
        (current) => current.id === deviceId ? { ...current, states: [...current.states, ...states] } : current
      ),
      false
    );
  }
  async updateWatchedState(deviceId, stateId, data) {
    this.saveFunctionTemplate(data);
    await this.saveDevices(
      this.devices.map(
        (d) => d.id === deviceId ? {
          ...d,
          states: d.states.map(
            (state) => state.id === stateId ? this.normalizeState(data, stateId) : state
          )
        } : d
      )
    );
  }
  async replaceWatchedStates(deviceId, data) {
    const device = this.devices.find((entry) => entry.id === deviceId);
    if (!device) {
      return;
    }
    for (const watched of device.states) {
      this.saveFunctionTemplate(data[watched.id]);
    }
    const states = device.states.filter((watched) => {
      var _a;
      return !((_a = data[watched.id]) == null ? void 0 : _a._delete);
    }).map((watched) => this.normalizeState(data[watched.id] || watched, watched.id));
    await this.saveDevices(
      this.devices.map((entry) => entry.id === deviceId ? { ...entry, states } : entry),
      false
    );
  }
  async removeWatchedState(deviceId, stateId) {
    await this.delObjectAsync(`devices.${deviceId}.${stateId}`, { recursive: true });
    await this.saveDevices(
      this.devices.map((d) => d.id === deviceId ? { ...d, states: d.states.filter((s) => s.id !== stateId) } : d)
    );
  }
  normalizeState(data, id) {
    var _a, _b;
    const limit = (input, fallback) => ({
      enabled: (input == null ? void 0 : input.enabled) === true,
      mode: ["below", "above", "outside", "inside"].includes(input == null ? void 0 : input.mode) ? input.mode : fallback,
      booleanValue: (input == null ? void 0 : input.booleanValue) === false || (input == null ? void 0 : input.booleanValue) === "false" ? false : true,
      min: typeof (input == null ? void 0 : input.min) === "number" ? input.min : void 0,
      max: typeof (input == null ? void 0 : input.max) === "number" ? input.max : void 0
    });
    return {
      id,
      name: String(data.name || id).trim(),
      sourceId: String(data.sourceId || "").trim(),
      remark: String(data.remark || "").trim(),
      function: String(data.function || "").trim(),
      warning: limit(data.warning, "outside"),
      alarm: limit(data.alarm, "outside"),
      staleWarning: {
        enabled: ((_a = data.staleWarning) == null ? void 0 : _a.enabled) === true,
        minutes: typeof ((_b = data.staleWarning) == null ? void 0 : _b.minutes) === "number" && data.staleWarning.minutes > 0 ? data.staleWarning.minutes : 60
      }
    };
  }
  saveFunctionTemplate(data) {
    const functionName = String((data == null ? void 0 : data.function) || "").trim();
    if (!functionName || (data == null ? void 0 : data._saveAsTemplate) !== true) {
      return;
    }
    this.functionTemplates[functionName] = (0, import_evaluation.createFunctionTemplate)(this.normalizeState(data, "template"));
  }
  normalizeDevices(value) {
    if (!Array.isArray(value)) {
      return [];
    }
    const used = /* @__PURE__ */ new Set();
    return value.filter((item) => item && typeof item === "object").map((item, i) => {
      const configuredId = String(item.id || "");
      const match = /^device_(\d+)$/.exec(configuredId);
      let number = match && Number(match[1]) > 0 ? Number(match[1]) : this.nextDeviceNumber;
      let id = `device_${String(number).padStart(3, "0")}`;
      while (used.has(id)) {
        number = this.nextDeviceNumber;
        id = `device_${String(number).padStart(3, "0")}`;
        this.nextDeviceNumber++;
      }
      used.add(id);
      this.nextDeviceNumber = Math.max(this.nextDeviceNumber, number + 1);
      return {
        id,
        name: String(item.name || `Device ${i + 1}`),
        states: Array.isArray(item.states) ? item.states.map(
          (s, j) => this.normalizeState(s, safeId(String(s.id || s.name || ""), `state_${j + 1}`))
        ) : []
      };
    });
  }
  async saveDevices(devices, refreshCards = true) {
    var _a;
    this.devices = devices;
    const activeCardDetails = new Set(
      devices.flatMap((device) => device.states.map((watched) => `${device.id}.${watched.id}`))
    );
    for (const key of this.cardDetails.keys()) {
      if (!activeCardDetails.has(key)) {
        this.cardDetails.delete(key);
      }
    }
    await this.rebuildObjects();
    await this.removeLegacyDeviceConfig();
    await this.refreshSubscriptions();
    await this.updateAll();
    if (refreshCards) {
      await ((_a = this.deviceManagement) == null ? void 0 : _a.refreshCards());
    }
    this.scheduleConfigurationBackup();
  }
  scheduleConfigurationBackup() {
    var _a;
    if (this.configurationBackupTimer) {
      clearTimeout(this.configurationBackupTimer);
      this.configurationBackupTimer = void 0;
    }
    const minutes = Number((_a = this.config.configurationBackupDelayMinutes) != null ? _a : 60);
    if (!Number.isFinite(minutes) || minutes <= 0) {
      return;
    }
    this.configurationBackupTimer = setTimeout(
      () => {
        this.configurationBackupTimer = void 0;
        void this.backupDeviceConfiguration().catch(
          (error) => this.log.error(`Could not back up device configuration: ${String(error)}`)
        );
      },
      Math.min(minutes, 35791) * 6e4
    );
  }
  async backupDeviceConfiguration() {
    const devicesFolder = await this.getObjectAsync("devices");
    if (!(devicesFolder == null ? void 0 : devicesFolder.native)) {
      throw new Error("The devices folder does not exist");
    }
    const instanceId = `system.adapter.${this.namespace}`;
    const instanceObject = await this.getForeignObjectAsync(instanceId);
    if (!instanceObject) {
      throw new Error(`The instance object ${instanceId} does not exist`);
    }
    if (!(0, import_configuration_backup.configurationBackupNeedsUpdate)(devicesFolder.native, instanceObject.native.deviceConfigurationBackup)) {
      return false;
    }
    instanceObject.native.deviceConfigurationBackup = structuredClone(devicesFolder.native);
    await this.setForeignObjectAsync(instanceId, instanceObject);
    this.log.info("Updated the device configuration backup in the instance object");
    return true;
  }
  async restoreDeviceConfigurationBackup(rebuild) {
    var _a;
    const instanceId = `system.adapter.${this.namespace}`;
    const instanceObject = await this.getForeignObjectAsync(instanceId);
    const backup = instanceObject == null ? void 0 : instanceObject.native.deviceConfigurationBackup;
    if (!backup || typeof backup !== "object" || Array.isArray(backup)) {
      return false;
    }
    this.nextDeviceNumber = typeof backup.nextDeviceNumber === "number" && backup.nextDeviceNumber > 0 ? Math.floor(backup.nextDeviceNumber) : 1;
    const devices = this.normalizeDevices(backup.devices);
    if (!devices.length) {
      return false;
    }
    this.functionTemplates = this.normalizeFunctionTemplates(backup.functionTemplates);
    this.devices = devices;
    if (rebuild) {
      await this.rebuildObjects();
      await this.refreshSubscriptions();
      await this.updateAll();
      await ((_a = this.deviceManagement) == null ? void 0 : _a.refreshCards());
      this.scheduleConfigurationBackup();
    }
    return true;
  }
  async rebuildObjects() {
    var _a;
    await this.setObjectAsync("devices", {
      type: "folder",
      common: { name: t("Devices", "Ger\xE4te") },
      native: {
        devices: this.devices,
        nextDeviceNumber: this.nextDeviceNumber,
        functionTemplates: this.functionTemplates
      }
    });
    const expected = /* @__PURE__ */ new Set();
    for (const device of this.devices) {
      expected.add(device.id);
      expected.add(`${device.id}.color`);
      expected.add(`${device.id}.icon`);
      expected.add(`${device.id}.${DEVICE_CARD_DETAILS_ID}`);
      await this.setObjectAsync(`devices.${device.id}`, {
        type: "device",
        common: { name: device.name },
        native: {}
      });
      await this.ensureState(`devices.${device.id}.color`, t("Card color", "Kachelfarbe"), "string", "text");
      await this.ensureState(`devices.${device.id}.icon`, t("Card icon", "Kachelsymbol"), "string", "text");
      await this.setObjectAsync(`devices.${device.id}.${DEVICE_CARD_DETAILS_ID}`, {
        type: "channel",
        common: { name: t("Device Manager data", "Device-Manager-Daten"), expert: true },
        native: {}
      });
      await this.ensureState(
        `devices.${device.id}.${DEVICE_CARD_DETAILS_ID}.details`,
        t("Device card details", "Kacheldetails"),
        "string",
        "html",
        void 0,
        true
      );
      for (const watched of device.states) {
        expected.add(`${device.id}.${watched.id}`);
        const base = `devices.${device.id}.${watched.id}`;
        const existingChannel = await this.getObjectAsync(base);
        if ((existingChannel == null ? void 0 : existingChannel.type) === "channel" && typeof ((_a = existingChannel.native) == null ? void 0 : _a.sourceId) === "string" && existingChannel.native.sourceId !== watched.sourceId) {
          this.resetUpdateHistories.add(base);
        }
        await this.setObjectAsync(base, {
          type: "channel",
          common: { name: watched.name },
          native: { sourceId: watched.sourceId, function: watched.function }
        });
        const unit = await this.getSourceUnit(watched.sourceId);
        await this.ensureState(`${base}.value`, t("Current value", "Aktueller Wert"), "mixed", "value", unit);
        await this.ensureState(`${base}.status`, t("Status", "Status"), "string", "text");
        await this.ensureState(`${base}.warning`, t("Warning", "Warnung"), "boolean", "indicator");
        await this.ensureState(`${base}.alarm`, t("Alarm", "Alarm"), "boolean", "indicator.alarm");
        await this.ensureState(
          `${base}.updateTimeout`,
          t("Update timeout", "Aktualisierungs-Timeout"),
          "boolean",
          "indicator.maintenance"
        );
        await this.ensureState(`${base}.sourceId`, t("Source state", "Quell-State"), "string", "text");
        await this.ensureState(`${base}.remark`, t("Remark", "Bemerkung"), "string", "text");
        await this.setObjectAsync(`${base}.level`, {
          type: "channel",
          common: { name: t("Notification levels", "Meldungs-Level") },
          native: {}
        });
        for (const [levelId, levelName] of Object.entries(NOTIFICATION_LEVEL_STATE_NAMES)) {
          await this.ensureNotificationLevelState(`${base}.level.${levelId}`, levelName);
        }
        await this.setObjectAsync(`${base}.data`, {
          type: "channel",
          common: { name: t("Monitoring data", "\xDCberwachungsdaten"), expert: true },
          native: {}
        });
        await this.ensureState(
          `${base}.data.lastUpdate`,
          t("Last update", "Letzte Aktualisierung"),
          "number",
          "value.time",
          void 0,
          true
        );
        await this.ensureState(
          `${base}.data.previousUpdate`,
          t("Previous update", "Vorherige Aktualisierung"),
          "number",
          "value.time",
          void 0,
          true
        );
        await this.ensureState(
          `${base}.data.updateInterval`,
          t("Update interval", "Aktualisierungsintervall"),
          "number",
          "value.interval",
          "ms",
          true
        );
        await this.ensureState(
          `${base}.data.averageUpdateInterval`,
          t("Average update interval", "Durchschnittliches Aktualisierungsintervall"),
          "number",
          "value.interval",
          "ms",
          true
        );
        await this.ensureState(
          `${base}.data.averageValue`,
          t("Average value", "Durchschnittlicher Wert"),
          "number",
          "value",
          unit,
          true
        );
        await this.ensureState(
          `${base}.data.updateHistory`,
          t("Last update timestamps", "Letzte Aktualisierungszeitstempel"),
          "string",
          "json",
          void 0,
          true
        );
        await this.ensureState(
          `${base}.data.valueHistory`,
          t("Last numeric values", "Letzte numerische Werte"),
          "string",
          "json",
          void 0,
          true
        );
        await this.ensureState(
          `${base}.data.details`,
          t("Monitoring details", "\xDCberwachungsdetails"),
          "string",
          "html",
          void 0,
          true
        );
      }
    }
    const objects = await this.getAdapterObjectsAsync();
    for (const id of Object.keys(objects)) {
      const fullId = id.startsWith(`${this.namespace}.`) ? id : `${this.namespace}.${id}`;
      if (!fullId.startsWith(`${this.namespace}.devices.`)) {
        continue;
      }
      const relative = fullId.slice(`${this.namespace}.devices.`.length);
      if (!relative) {
        continue;
      }
      const parts = relative.split(".");
      const key = parts.length === 1 ? parts[0] : `${parts[0]}.${parts[1]}`;
      if (!expected.has(key)) {
        await this.delObjectAsync(`devices.${key}`, { recursive: true });
      }
    }
  }
  async loadDevicesFromObjects() {
    var _a, _b, _c;
    const folder = await this.getObjectAsync("devices");
    if (typeof ((_a = folder == null ? void 0 : folder.native) == null ? void 0 : _a.nextDeviceNumber) === "number" && folder.native.nextDeviceNumber > 0) {
      this.nextDeviceNumber = Math.floor(folder.native.nextDeviceNumber);
    }
    this.functionTemplates = this.normalizeFunctionTemplates((_b = folder == null ? void 0 : folder.native) == null ? void 0 : _b.functionTemplates);
    return this.normalizeDevices((_c = folder == null ? void 0 : folder.native) == null ? void 0 : _c.devices);
  }
  normalizeFunctionTemplates(value) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n;
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return {};
    }
    const templates = {};
    for (const [name, template] of Object.entries(value)) {
      const functionName = name.trim();
      if (!functionName || !template || typeof template !== "object") {
        continue;
      }
      const mode = (input) => ["below", "above", "outside", "inside"].includes(String(input)) ? input : "outside";
      const number = (input) => typeof input === "number" && Number.isFinite(input) ? input : void 0;
      templates[functionName] = {
        warning: {
          enabled: ((_a = template.warning) == null ? void 0 : _a.enabled) === true,
          mode: mode((_b = template.warning) == null ? void 0 : _b.mode),
          booleanValue: ((_c = template.warning) == null ? void 0 : _c.booleanValue) === false || ((_d = template.warning) == null ? void 0 : _d.booleanValue) === "false" ? false : true,
          min: number((_e = template.warning) == null ? void 0 : _e.min),
          max: number((_f = template.warning) == null ? void 0 : _f.max)
        },
        alarm: {
          enabled: ((_g = template.alarm) == null ? void 0 : _g.enabled) === true,
          mode: mode((_h = template.alarm) == null ? void 0 : _h.mode),
          booleanValue: ((_i = template.alarm) == null ? void 0 : _i.booleanValue) === false || ((_j = template.alarm) == null ? void 0 : _j.booleanValue) === "false" ? false : true,
          min: number((_k = template.alarm) == null ? void 0 : _k.min),
          max: number((_l = template.alarm) == null ? void 0 : _l.max)
        },
        staleWarning: {
          enabled: ((_m = template.staleWarning) == null ? void 0 : _m.enabled) === true,
          minutes: number((_n = template.staleWarning) == null ? void 0 : _n.minutes) || 60
        }
      };
    }
    return templates;
  }
  async removeLegacyDeviceConfig() {
    const instanceId = `system.adapter.${this.namespace}`;
    const object = await this.getForeignObjectAsync(instanceId);
    if (!object || !Object.prototype.hasOwnProperty.call(object.native, "devices")) {
      return;
    }
    const { devices: _devices, ...native } = object.native;
    await this.setForeignObjectAsync(instanceId, { ...object, native });
  }
  async ensureState(id, name, type, role, unit, expert = false) {
    await this.setObjectAsync(id, {
      type: "state",
      common: {
        name,
        type,
        role,
        read: true,
        write: false,
        ...unit ? { unit } : {},
        ...expert ? { expert: true } : {}
      },
      native: {}
    });
  }
  async ensureNotificationLevelState(id, name) {
    await this.setObjectAsync(id, {
      type: "state",
      common: {
        name,
        type: "number",
        role: "value",
        read: true,
        write: true,
        states: {
          0: this.localize("Standard", "Standard"),
          1: this.localize("Disabled", "Deaktiviert"),
          2: "Info",
          3: this.localize("Warning", "Warnung"),
          4: "Alarm"
        },
        def: 0
      },
      native: {}
    });
    const current = await this.getStateAsync(id);
    if (!isNotificationLevelValue(current == null ? void 0 : current.val)) {
      await this.setStateAsync(id, 0, true);
    } else if (current.ack === false) {
      await this.setStateAsync(id, { val: current.val, ack: true });
    }
  }
  async refreshSubscriptions() {
    for (const id of this.subscribed) {
      this.unsubscribeForeignStates(id);
      this.unsubscribeForeignObjects(id);
    }
    for (const id of this.notificationLevelSubscriptions) {
      this.unsubscribeStates(id);
    }
    this.subscribed = new Set(this.devices.flatMap((d) => d.states.map((s) => s.sourceId)).filter(Boolean));
    this.notificationLevelSubscriptions = new Set(
      this.devices.flatMap(
        (device) => device.states.flatMap(
          (watched) => Object.keys(NOTIFICATION_LEVEL_STATE_NAMES).map(
            (levelId) => `devices.${device.id}.${watched.id}.level.${levelId}`
          )
        )
      )
    );
    for (const id of this.subscribed) {
      this.subscribeForeignStates(id);
      this.subscribeForeignObjects(id);
    }
    for (const id of this.notificationLevelSubscriptions) {
      this.subscribeStates(id);
    }
    await this.refreshSourceValidity();
  }
  isValidSourceObject(object) {
    var _a;
    return (object == null ? void 0 : object.type) === "state" && !!supportedSourceType((_a = object.common) == null ? void 0 : _a.type);
  }
  async getValidSourceTypes() {
    const objects = await this.getForeignObjectsAsync("*", "state");
    return Object.fromEntries(
      Object.entries(objects).map(([id, object]) => {
        var _a;
        return [id, supportedSourceType((_a = object.common) == null ? void 0 : _a.type)];
      }).filter((entry) => !!entry[1])
    );
  }
  async getValidSourceIds() {
    return Object.keys(await this.getValidSourceTypes());
  }
  async refreshSourceValidity() {
    this.invalidSources.clear();
    this.sourceUnits.clear();
    await Promise.all(
      [...this.subscribed].map(async (id) => {
        const object = await this.getForeignObjectAsync(id);
        if (this.isValidSourceObject(object)) {
          this.sourceUnits.set(id, typeof object.common.unit === "string" ? object.common.unit : "");
        } else {
          this.invalidSources.add(id);
        }
      })
    );
  }
  async getSourceUnit(sourceId) {
    if (this.sourceUnits.has(sourceId)) {
      return this.sourceUnits.get(sourceId) || "";
    }
    const object = await this.getForeignObjectAsync(sourceId);
    const unit = this.isValidSourceObject(object) && typeof object.common.unit === "string" ? object.common.unit : "";
    this.sourceUnits.set(sourceId, unit);
    return unit;
  }
  async readMonitoringData(base, sourceId) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i;
    const [
      currentValue,
      bundledValue,
      status,
      bundledStatus,
      warning,
      bundledWarning,
      alarm,
      bundledAlarm,
      updateTimeout,
      bundledUpdateTimeout,
      source,
      lastUpdate,
      previousUpdate,
      updateInterval,
      average,
      history,
      valueHistory
    ] = await Promise.all([
      this.getStateAsync(`${base}.value`),
      this.getStateAsync(`${base}.data.value`),
      this.getStateAsync(`${base}.status`),
      this.getStateAsync(`${base}.data.status`),
      this.getStateAsync(`${base}.warning`),
      this.getStateAsync(`${base}.data.warning`),
      this.getStateAsync(`${base}.alarm`),
      this.getStateAsync(`${base}.data.alarm`),
      this.getStateAsync(`${base}.updateTimeout`),
      this.getStateAsync(`${base}.data.updateTimeout`),
      this.getStateAsync(`${base}.sourceId`),
      this.getStateAsync(`${base}.data.lastUpdate`),
      this.getStateAsync(`${base}.data.previousUpdate`),
      this.getStateAsync(`${base}.data.updateInterval`),
      this.getStateAsync(`${base}.data.averageUpdateInterval`),
      this.getStateAsync(`${base}.data.updateHistory`),
      this.getStateAsync(`${base}.data.valueHistory`)
    ]);
    if (status || bundledStatus) {
      return {
        sourceId: typeof (source == null ? void 0 : source.val) === "string" ? source.val : sourceId,
        value: (_a = currentValue == null ? void 0 : currentValue.val) != null ? _a : bundledValue == null ? void 0 : bundledValue.val,
        status: typeof ((_b = status != null ? status : bundledStatus) == null ? void 0 : _b.val) === "string" ? (_c = status != null ? status : bundledStatus) == null ? void 0 : _c.val : void 0,
        warning: typeof ((_d = warning != null ? warning : bundledWarning) == null ? void 0 : _d.val) === "boolean" ? Boolean((_e = warning != null ? warning : bundledWarning) == null ? void 0 : _e.val) : void 0,
        alarm: typeof ((_f = alarm != null ? alarm : bundledAlarm) == null ? void 0 : _f.val) === "boolean" ? Boolean((_g = alarm != null ? alarm : bundledAlarm) == null ? void 0 : _g.val) : void 0,
        updateTimeout: typeof ((_h = updateTimeout != null ? updateTimeout : bundledUpdateTimeout) == null ? void 0 : _h.val) === "boolean" ? Boolean((_i = updateTimeout != null ? updateTimeout : bundledUpdateTimeout) == null ? void 0 : _i.val) : void 0,
        lastUpdate: typeof (lastUpdate == null ? void 0 : lastUpdate.val) === "number" ? lastUpdate.val : void 0,
        previousUpdate: typeof (previousUpdate == null ? void 0 : previousUpdate.val) === "number" ? previousUpdate.val : void 0,
        updateInterval: typeof (updateInterval == null ? void 0 : updateInterval.val) === "number" ? updateInterval.val : void 0,
        averageUpdateInterval: typeof (average == null ? void 0 : average.val) === "number" ? average.val : void 0,
        updateHistory: (0, import_update_history.parseUpdateHistory)(history == null ? void 0 : history.val),
        valueHistory: (0, import_update_history.parseValueHistory)(valueHistory == null ? void 0 : valueHistory.val)
      };
    }
    const legacy = await Promise.all(LEGACY_RUNTIME_STATE_IDS.map((id) => this.getStateAsync(`${base}.${id}`)));
    const value = (id) => {
      var _a2;
      return (_a2 = legacy[LEGACY_RUNTIME_STATE_IDS.indexOf(id)]) == null ? void 0 : _a2.val;
    };
    return {
      sourceId: typeof value("updateHistorySource") === "string" ? String(value("updateHistorySource")) : void 0,
      value: value("value"),
      status: typeof value("status") === "string" ? value("status") : void 0,
      warning: typeof value("warning") === "boolean" ? Boolean(value("warning")) : void 0,
      alarm: typeof value("alarm") === "boolean" ? Boolean(value("alarm")) : void 0,
      updateTimeout: typeof value("updateTimeout") === "boolean" ? Boolean(value("updateTimeout")) : void 0,
      lastUpdate: typeof value("lastUpdate") === "number" ? Number(value("lastUpdate")) : void 0,
      previousUpdate: typeof value("previousUpdate") === "number" ? Number(value("previousUpdate")) : void 0,
      updateInterval: typeof value("updateInterval") === "number" ? Number(value("updateInterval")) : void 0,
      averageUpdateInterval: typeof value("averageUpdateInterval") === "number" ? Number(value("averageUpdateInterval")) : void 0,
      updateHistory: (0, import_update_history.parseUpdateHistory)(value("updateHistory")),
      valueHistory: []
    };
  }
  async removeLegacyRuntimeStates() {
    if (this.legacyRuntimeStatesRemoved) {
      return;
    }
    const objects = await this.getAdapterObjectsAsync();
    for (const device of this.devices) {
      for (const watched of device.states) {
        const base = `devices.${device.id}.${watched.id}`;
        for (const id of OBSOLETE_DIRECT_STATE_IDS) {
          const relativeId = `${base}.${id}`;
          const fullId = `${this.namespace}.${relativeId}`;
          if (objects[fullId] || objects[relativeId]) {
            await this.delObjectAsync(relativeId);
          }
        }
        for (const id of OBSOLETE_DATA_STATE_IDS) {
          const relativeId = `${base}.data.${id}`;
          const fullId = `${this.namespace}.${relativeId}`;
          if (objects[fullId] || objects[relativeId]) {
            await this.delObjectAsync(relativeId);
          }
        }
      }
    }
    this.legacyRuntimeStatesRemoved = true;
  }
  async updateAll() {
    for (const device of this.devices) {
      for (const watched of device.states) {
        const state = await this.getForeignStateAsync(watched.sourceId);
        await this.updateValue(device, watched, state);
      }
      await this.updateDeviceSummary(device);
      await this.updateDeviceCardDetails(device);
    }
    await this.updateDeviceInfo();
    await this.removeLegacyRuntimeStates();
  }
  async queueMessageEvent(event) {
    const write = this.messageWriteQueue.catch(() => void 0).then(async () => {
      await this.setStateChangedAsync("info.message", {
        val: JSON.stringify(event),
        ack: true
      });
    });
    this.messageWriteQueue = write;
    await write;
  }
  async updateDeviceInfo() {
    const devices = await Promise.all(
      this.devices.map(async (device) => {
        const states = await Promise.all(
          device.states.map(async (watched) => {
            const sourceState = await this.getForeignStateAsync(watched.sourceId);
            const updateTimeout = (0, import_evaluation.isUpdateTimedOut)(sourceState, watched.staleWarning);
            const status = this.getWatchedStatus(watched, sourceState, updateTimeout);
            return {
              id: watched.id,
              name: watched.name,
              sourceId: watched.sourceId,
              function: watched.function,
              sourceValid: status !== "invalid",
              status,
              warning: status === "warning",
              alarm: status === "alarm",
              updateTimeout
            };
          })
        );
        return { id: device.id, name: device.name, status: await this.getDeviceStatus(device), states };
      })
    );
    await this.setStateChangedAsync("info.deviceInfo", {
      val: JSON.stringify({ devices }),
      ack: true
    });
  }
  async getDeviceStatus(device) {
    const rank = { invalid: 0, timeout: 1, alarm: 2, warning: 3, unknown: 4, ok: 5 };
    let status = "ok";
    for (const watched of device.states) {
      const state = await this.getForeignStateAsync(watched.sourceId);
      const current = this.getWatchedStatus(watched, state);
      if (rank[current] < rank[status]) {
        status = current;
      }
    }
    return status;
  }
  getWatchedStatus(watched, state, updateTimeout = (0, import_evaluation.isUpdateTimedOut)(state, watched.staleWarning)) {
    var _a;
    return this.invalidSources.has(watched.sourceId) ? "invalid" : (0, import_evaluation.getWatchStatus)((_a = state == null ? void 0 : state.val) != null ? _a : null, watched.warning, watched.alarm, updateTimeout);
  }
  async updateDeviceSummary(device) {
    const status = await this.getDeviceStatus(device);
    await Promise.all([
      this.setStateChangedAsync(`devices.${device.id}.color`, { val: COLORS[status], ack: true }),
      this.setStateChangedAsync(`devices.${device.id}.icon`, { val: STATUS_ICONS[status], ack: true })
    ]);
  }
  async updateDeviceCardDetails(device) {
    var _a;
    const previous = (_a = this.cardDetailsQueues.get(device.id)) != null ? _a : Promise.resolve();
    const current = previous.catch(() => void 0).then(async () => {
      const details = device.states.map((watched) => this.cardDetails.get(`${device.id}.${watched.id}`) || "").filter(Boolean).join("");
      await this.setStateChangedAsync(`devices.${device.id}.${DEVICE_CARD_DETAILS_ID}.details`, {
        val: details,
        ack: true
      });
    });
    this.cardDetailsQueues.set(device.id, current);
    try {
      await current;
    } finally {
      if (this.cardDetailsQueues.get(device.id) === current) {
        this.cardDetailsQueues.delete(device.id);
      }
    }
  }
  async updateDetailsDisplay(device, watched, status, display, unit, data) {
    const base = `devices.${device.id}.${watched.id}`;
    const tooltip = [];
    if (watched.warning.enabled) {
      tooltip.push(
        `${this.localize("Warning condition:", "Warnbedingung:")} ${this.formatLimitDescription(watched.warning, data.value, unit)}`
      );
    }
    if (watched.alarm.enabled) {
      tooltip.push(
        `${this.localize("Alarm condition:", "Alarmbedingung:")} ${this.formatLimitDescription(watched.alarm, data.value, unit)}`
      );
    }
    if (watched.staleWarning.enabled) {
      tooltip.push(`Timeout: ${watched.staleWarning.minutes} min`);
    }
    const lastTimestamp = data.lastUpdate === null ? "-" : timestampDisplay(data.lastUpdate);
    const previousTimestamp = data.previousUpdate === null ? "-" : timestampDisplay(data.previousUpdate);
    const updateInterval = data.updateInterval === null ? "-" : (0, import_update_history.intervalDisplay)(data.updateInterval);
    const averageUpdateInterval = data.averageUpdateInterval === null ? "-" : (0, import_update_history.intervalDisplay)(data.averageUpdateInterval);
    const averageValue = data.averageValue === null || data.updateTimeout || typeof data.value !== "number" || !Number.isFinite(data.value) ? "" : ` \xD8: ${String(Number(data.averageValue.toFixed(2)))}${unit ? ` ${unit}` : ""}`;
    const intervalLabel = this.localize("Last interval:", "Letztes Intervall:");
    const title = tooltip.length ? ` title="${escapeHtml(tooltip.join("\n"))}"` : "";
    const details = `<div${title} style="width:268px;max-width:none;box-sizing:border-box;text-align:center;line-height:1.2;margin:4px 0 10px"><img src="${STATUS_ICONS[status]}" style="display:block;width:24px;height:24px;margin:0 auto 3px"><div style="color:${COLORS[status]}">${escapeHtml(display)}${escapeHtml(averageValue)}</div><div>${escapeHtml(this.localize("Previous:", "Vorletzter:"))} ${escapeHtml(previousTimestamp)}</div><div>${escapeHtml(this.localize("Last:", "Letzter:"))} ${escapeHtml(lastTimestamp)}</div><div style="white-space:nowrap">${escapeHtml(intervalLabel)} ${escapeHtml(updateInterval)} &nbsp;\xD8: ${escapeHtml(averageUpdateInterval)}</div></div>`;
    await this.setStateChangedAsync(`${base}.data.details`, { val: details, ack: true });
    this.cardDetails.set(`${device.id}.${watched.id}`, details);
    await this.updateDeviceCardDetails(device);
  }
  async updateValue(device, watched, sourceState) {
    var _a;
    const key = `${device.id}.${watched.id}`;
    const previous = (_a = this.updateHistoryQueues.get(key)) != null ? _a : Promise.resolve();
    const current = previous.catch(() => void 0).then(() => this.updateValueNow(device, watched, sourceState));
    this.updateHistoryQueues.set(key, current);
    try {
      await current;
    } finally {
      if (this.updateHistoryQueues.get(key) === current) {
        this.updateHistoryQueues.delete(key);
      }
    }
  }
  async updateValueNow(device, watched, sourceState) {
    var _a, _b, _c, _d;
    const base = `devices.${device.id}.${watched.id}`;
    const previousData = await this.readMonitoringData(base, watched.sourceId);
    const sameSource = !this.resetUpdateHistories.has(base) && previousData.sourceId === watched.sourceId;
    let updateHistory = sameSource ? (0, import_update_history.parseUpdateHistory)(previousData.updateHistory) : [];
    if (sameSource && !updateHistory.length) {
      updateHistory = [previousData.previousUpdate, previousData.lastUpdate].filter((entry) => typeof entry === "number" && Number.isFinite(entry) && entry > 0).sort((a, b) => a - b);
    }
    const timestamp = sourceState == null ? void 0 : sourceState.ts;
    const lastTimestamp = updateHistory.at(-1);
    if (typeof timestamp === "number" && Number.isFinite(timestamp) && timestamp > 0 && (lastTimestamp === void 0 || timestamp > lastTimestamp)) {
      updateHistory = [...updateHistory, timestamp].slice(-import_update_history.UPDATE_HISTORY_SIZE);
    }
    const value = (_a = sourceState == null ? void 0 : sourceState.val) != null ? _a : null;
    let valueHistory = sameSource ? (0, import_update_history.parseValueHistory)(previousData.valueHistory) : [];
    if (value !== null && typeof value !== "number") {
      valueHistory = [];
    }
    if (typeof timestamp === "number" && Number.isFinite(timestamp) && timestamp > 0) {
      const lastValueTimestamp = (_b = valueHistory.at(-1)) == null ? void 0 : _b.timestamp;
      if (typeof value === "number" && Number.isFinite(value) && (lastValueTimestamp === void 0 || timestamp > lastValueTimestamp)) {
        valueHistory = [...valueHistory, { timestamp, value }].slice(-import_update_history.UPDATE_HISTORY_SIZE);
      }
    }
    const lastUpdate = (_c = updateHistory.at(-1)) != null ? _c : null;
    const previousUpdate = (_d = updateHistory.at(-2)) != null ? _d : null;
    const updateInterval = lastUpdate === null || previousUpdate === null ? null : lastUpdate - previousUpdate;
    const averageUpdateInterval = (0, import_update_history.averageInterval)(updateHistory);
    const updateTimedOut = (0, import_evaluation.isUpdateTimedOut)(sourceState, watched.staleWarning);
    const averageValue = (0, import_update_history.timeWeightedAverage)(
      valueHistory,
      watched.staleWarning.enabled ? watched.staleWarning.minutes * 6e4 : void 0
    );
    const status = this.getWatchedStatus(watched, sourceState, updateTimedOut);
    const unit = await this.getSourceUnit(watched.sourceId);
    const display = status === "invalid" ? `${watched.name}: \u26A0 ${watched.sourceId}` : `${watched.name}: ${value === null ? "\u2014" : `${String(value)}${unit ? ` ${unit}` : ""}`}`;
    const data = {
      sourceId: watched.sourceId,
      value,
      unit,
      status,
      warning: status === "warning",
      alarm: status === "alarm",
      updateTimeout: updateTimedOut,
      lastUpdate,
      previousUpdate,
      updateInterval,
      averageUpdateInterval,
      updateHistory,
      averageValue,
      valueHistory
    };
    await Promise.all([
      this.setStateChangedAsync(`${base}.value`, { val: data.value, ack: true }),
      this.setStateChangedAsync(`${base}.status`, { val: data.status, ack: true }),
      this.setStateChangedAsync(`${base}.warning`, { val: data.warning, ack: true }),
      this.setStateChangedAsync(`${base}.alarm`, { val: data.alarm, ack: true }),
      this.setStateChangedAsync(`${base}.updateTimeout`, { val: data.updateTimeout, ack: true }),
      this.setStateChangedAsync(`${base}.sourceId`, { val: data.sourceId, ack: true }),
      this.setStateChangedAsync(`${base}.remark`, { val: watched.remark || "", ack: true }),
      this.setStateChangedAsync(`${base}.data.lastUpdate`, { val: data.lastUpdate, ack: true }),
      this.setStateChangedAsync(`${base}.data.previousUpdate`, { val: data.previousUpdate, ack: true }),
      this.setStateChangedAsync(`${base}.data.updateInterval`, { val: data.updateInterval, ack: true }),
      this.setStateChangedAsync(`${base}.data.averageUpdateInterval`, {
        val: data.averageUpdateInterval,
        ack: true
      }),
      this.setStateChangedAsync(`${base}.data.averageValue`, { val: data.averageValue, ack: true }),
      this.setStateChangedAsync(`${base}.data.updateHistory`, {
        val: JSON.stringify(data.updateHistory),
        ack: true
      }),
      this.setStateChangedAsync(`${base}.data.valueHistory`, {
        val: JSON.stringify(data.valueHistory),
        ack: true
      })
    ]);
    this.resetUpdateHistories.delete(base);
    await this.notifyStatusTransition(device, watched, status, data);
    await this.updateDetailsDisplay(device, watched, status, display, unit, data);
  }
  async notifyStatusTransition(device, watched, status, data) {
    var _a, _b;
    const key = `${device.id}.${watched.id}`;
    const previous = this.notificationStatuses.get(key);
    this.notificationStatuses.set(key, status);
    if (!previous) {
      return;
    }
    const category = (0, import_notifications.notificationCategoryForTransition)(previous, status);
    if (!category) {
      return;
    }
    if (!this.isNotificationEnabled(category)) {
      return;
    }
    if (category === "deviceTimeout" && !watched.staleWarning.enabled) {
      return;
    }
    const base = `devices.${device.id}.${watched.id}`;
    const levelStateId = (0, import_notifications.notificationLevelStateForCategory)(category);
    const configuredLevel = await this.getStateAsync(`${base}.level.${levelStateId}`);
    const outputCategory = (0, import_notifications.notificationCategoryForLevel)(configuredLevel == null ? void 0 : configuredLevel.val, category);
    if (!outputCategory) {
      return;
    }
    const templateTypes = {
      deviceWarning: "warning",
      deviceAlarm: "alarm",
      deviceTimeout: "timeout",
      invalidSource: "invalidSource",
      deviceRecovered: "recovered"
    };
    const templateType = templateTypes[category];
    const now = Date.now();
    const messageValues = {
      device: device.name,
      state: watched.name,
      sourceId: watched.sourceId,
      value: data.value === null ? "\u2014" : String(data.value),
      unit: data.unit,
      remark: ((_a = watched.remark) == null ? void 0 : _a.trim()) || "",
      warningLimits: this.formatLimitDescription(watched.warning, data.value, data.unit),
      alarmLimits: this.formatLimitDescription(watched.alarm, data.value, data.unit),
      timeoutMinutes: String(watched.staleWarning.minutes),
      lastUpdate: data.lastUpdate === null ? "\u2014" : timestampDisplay(data.lastUpdate),
      triggeredAt: timestampDisplay(now)
    };
    const messageText = renderMessageTemplate(this.getMessageTemplate(templateType), messageValues);
    const notificationTitle = renderMessageTemplate(this.getNotificationTitleTemplate(templateType), messageValues);
    const notificationKey = `${key}|${outputCategory}|${notificationTitle}|${messageText}`;
    const lastSent = this.notificationLastSent.get(notificationKey);
    if (lastSent !== void 0 && now - lastSent < 1e4) {
      return;
    }
    this.notificationLastSent.set(notificationKey, now);
    const messageEvent = {
      type: templateType,
      category: outputCategory,
      title: notificationTitle,
      deviceId: device.id,
      deviceName: device.name,
      stateId: watched.id,
      stateName: watched.name,
      sourceId: watched.sourceId,
      remark: ((_b = watched.remark) == null ? void 0 : _b.trim()) || "",
      value: data.value,
      unit: data.unit,
      triggeredAt: now,
      lastUpdate: data.lastUpdate,
      ...category === "deviceTimeout" ? { timeoutMinutes: watched.staleWarning.minutes } : {},
      message: messageText
    };
    try {
      await this.queueMessageEvent(messageEvent);
    } catch (error) {
      this.log.warn(`Could not write notification message state: ${String(error)}`);
    }
    if (this.config.sendNotificationsViaNotify !== false) {
      try {
        const notificationText = notificationTitle ? `${notificationTitle}
${messageText}` : messageText;
        await this.registerNotification("device-monitoring", outputCategory, notificationText);
      } catch (error) {
        this.log.warn(`Could not register notification ${outputCategory}: ${String(error)}`);
      }
    }
  }
  formatLimitDescription(limit, value, unit) {
    if (!limit.enabled) {
      return this.localize("disabled", "deaktiviert");
    }
    if (typeof value === "boolean") {
      return limit.booleanValue === void 0 ? "\u2014" : String(limit.booleanValue);
    }
    if (typeof value !== "number" && limit.min === void 0 && limit.max === void 0) {
      return "\u2014";
    }
    const suffix = unit ? ` ${unit}` : "";
    const min = limit.min === void 0 ? "\u2014" : `${limit.min}${suffix}`;
    const max = limit.max === void 0 ? "\u2014" : `${limit.max}${suffix}`;
    switch (limit.mode) {
      case "below":
        return this.localize(`below ${min}`, `kleiner als ${min}`);
      case "above":
        return this.localize(`above ${max}`, `gr\xF6\xDFer als ${max}`);
      case "outside":
        return this.localize(`outside ${min} - ${max}`, `au\xDFerhalb ${min} - ${max}`);
      case "inside":
        return this.localize(`inside ${min} - ${max}`, `innerhalb ${min} - ${max}`);
    }
    return "\u2014";
  }
  getMessageTemplate(type) {
    var _a;
    const configKeys = {
      warning: "warningMessageTemplate",
      alarm: "alarmMessageTemplate",
      timeout: "timeoutMessageTemplate",
      invalidSource: "invalidSourceMessageTemplate",
      recovered: "recoveredMessageTemplate"
    };
    const configKey = configKeys[type];
    const configured = this.config[configKey];
    return typeof configured === "string" && configured.trim() && !((_a = LEGACY_DEFAULT_MESSAGE_TEMPLATES[type]) == null ? void 0 : _a.includes(configured)) ? configured : this.localize(DEFAULT_MESSAGE_TEMPLATES[type].en, DEFAULT_MESSAGE_TEMPLATES[type].de);
  }
  getNotificationTitleTemplate(type) {
    var _a;
    const configKeys = {
      warning: "warningTitleTemplate",
      alarm: "alarmTitleTemplate",
      timeout: "timeoutTitleTemplate",
      invalidSource: "invalidSourceTitleTemplate",
      recovered: "recoveredTitleTemplate"
    };
    const configKey = configKeys[type];
    const configured = this.config[configKey];
    return typeof configured === "string" && configured.trim() && !((_a = LEGACY_DEFAULT_NOTIFICATION_TITLE_TEMPLATES[type]) == null ? void 0 : _a.includes(configured)) ? configured : this.localize(
      DEFAULT_NOTIFICATION_TITLE_TEMPLATES[type].en,
      DEFAULT_NOTIFICATION_TITLE_TEMPLATES[type].de
    );
  }
  isNotificationEnabled(category) {
    const configured = this.config.enabledNotifications;
    return !Array.isArray(configured) || configured.includes(category);
  }
}
if (require.main !== module) {
  module.exports = (options) => new DeviceMonitoring(options);
} else {
  new DeviceMonitoring();
}
//# sourceMappingURL=main.js.map
