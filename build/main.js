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
function limitDisplay(limit, unit = "") {
  var _a, _b, _c, _d;
  const suffix = unit ? ` ${unit}` : "";
  if (limit.mode === "below") {
    return `< ${(_a = limit.min) != null ? _a : "\u2014"}${suffix}`;
  }
  if (limit.mode === "above") {
    return `> ${(_b = limit.max) != null ? _b : "\u2014"}${suffix}`;
  }
  return `${(_c = limit.min) != null ? _c : "\u2014"}\u2013${(_d = limit.max) != null ? _d : "\u2014"}${suffix}`;
}
function timestampDisplay(timestamp) {
  return new Date(timestamp).toISOString().replace("T", " ").replace(".000Z", " UTC");
}
function intervalDisplay(milliseconds) {
  const seconds = Math.max(0, Math.round(milliseconds / 1e3));
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor(seconds % 86400 / 3600);
  const minutes = Math.floor(seconds % 3600 / 60);
  const restSeconds = seconds % 60;
  return [days && `${days}d`, hours && `${hours}h`, minutes && `${minutes}m`, `${restSeconds}s`].filter(Boolean).join(" ");
}
function escapeHtml(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
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
          const validSourceIds = await this.adapter.getValidSourceIds();
          const data = await context.showForm(
            stateForm(this.adapter.getFunctionTemplates(), this.adapter.getFunctionNames(), device.states),
            {
              title: t("Add monitored state", "\xDCberwachungs-State hinzuf\xFCgen"),
              data: defaultStateForm(validSourceIds),
              buttons: ["apply", "cancel"],
              applyDisabledRule: addStateDisabledRule(device.states)
            }
          );
          if (!(data == null ? void 0 : data.sourceId) || !(data == null ? void 0 : data.name)) {
            return { refresh: "none" };
          }
          await this.adapter.addWatchedState(device.id, data);
          return { refresh: "devices" };
        }
      }
    ];
    if (device.states.length) {
      actions.push({
        id: "editStates",
        icon: "settings",
        description: t("Edit monitored states", "\xDCberwachungs-States bearbeiten"),
        handler: async (_deviceId, context) => {
          const validSourceIds = await this.adapter.getValidSourceIds();
          const formData = {
            _validSourceIds: validSourceIds,
            ...Object.fromEntries(device.states.map((watched) => [watched.id, watched]))
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
          return { refresh: "devices" };
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
    const customInfoItems = Object.fromEntries(
      device.states.map((watched) => [
        watched.id,
        {
          type: "state",
          oid: `devices.${device.id}.${watched.id}.details`,
          control: "html",
          label: "",
          newLine: true,
          xs: 12
        }
      ])
    );
    return {
      id: device.id,
      name: device.name,
      icon: { stateId: `${this.adapter.namespace}.devices.${device.id}.icon` },
      backgroundColor: { stateId: `${this.adapter.namespace}.devices.${device.id}.color` },
      ...Object.keys(customInfoItems).length ? {
        customInfo: {
          id: device.id,
          schema: { type: "panel", style: { marginTop: "-56px" }, items: customInfoItems }
        }
      } : {},
      actions
    };
  }
}
function deviceForm() {
  return {
    type: "panel",
    items: { name: { type: "text", label: t("Device name", "Ger\xE4tename"), newLine: true, xs: 12 } }
  };
}
function defaultLimit(mode) {
  return { enabled: false, mode };
}
function defaultStateForm(validSourceIds) {
  return {
    name: "",
    sourceId: "",
    _validSourceIds: validSourceIds,
    function: "",
    warning: defaultLimit("outside"),
    alarm: defaultLimit("outside"),
    staleWarning: { enabled: false, minutes: 60 }
  };
}
function stateForm(functionTemplates, functionNames, states, stateId) {
  const functions = [.../* @__PURE__ */ new Set([...functionNames, ...Object.keys(functionTemplates)])].sort();
  const key = (path) => stateId ? `${stateId}.${path}` : path;
  const data = (path) => stateId ? `data[${JSON.stringify(stateId)}].${path}` : `data.${path}`;
  const existingNames = JSON.stringify(states.map((state) => state.name.trim().toLowerCase()));
  const otherStateIds = JSON.stringify(states.filter((state) => state.id !== stateId).map((state) => state.id));
  const nameValidator = stateId ? `return (${data("_delete")} || (() => { const name = String(${data("name")} || '').trim().toLowerCase(); return !!name && !${otherStateIds}.some(id => !data[id]?._delete && String(data[id]?.name || '').trim().toLowerCase() === name); })())` : `return (() => { const name = String(${data("name")} || '').trim().toLowerCase(); return !!name && !${existingNames}.includes(name); })()`;
  const sourceValidator = `return (${stateId ? `${data("_delete")} || ` : ""}(Array.isArray(data._validSourceIds) && data._validSourceIds.includes(String(${data("sourceId")} || '').trim())))`;
  const target = stateId ? `data[${JSON.stringify(stateId)}]` : "data";
  const templates = JSON.stringify(functionTemplates);
  const applyFunctionTemplate = `(() => { const template = ${templates}[${data("function")}]; if (template) { ${target}.warning = { ...${target}.warning, ...template.warning }; ${target}.alarm = { ...${target}.alarm, ...template.alarm }; ${target}.staleWarning = { ...${target}.staleWarning, ...template.staleWarning }; } return ${data("function")}; })()`;
  const templateValue = (path) => ({
    calculateFunc: `(${templates}[${data("function")}] ? ${templates}[${data("function")}].${path} : ${data(path)})`,
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
    [key(`${prefix}Header`)]: sectionHeader(label, color),
    [key(`${prefix}.enabled`)]: {
      type: "checkbox",
      label: t("Enabled", "Aktiviert"),
      newLine: true,
      xs: 4
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
      hidden: `!${data(`${prefix}.enabled`)}`
    },
    [key(`${prefix}.min`)]: {
      type: "number",
      label: t("Lower limit", "Untergrenze"),
      newLine: true,
      xs: 6,
      hidden: `!${data(`${prefix}.enabled`)} || ${data(`${prefix}.mode`)} === 'above'`
    },
    [key(`${prefix}.max`)]: {
      type: "number",
      label: t("Upper limit", "Obergrenze"),
      xs: 6,
      hidden: `!${data(`${prefix}.enabled`)} || ${data(`${prefix}.mode`)} === 'below'`
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
        customFilter: { type: "state", common: { type: "number" } },
        validator: sourceValidator,
        validatorErrorText: t(
          "Please select an existing ioBroker state",
          "Bitte einen vorhandenen ioBroker-State ausw\xE4hlen"
        ),
        validatorNoSaveOnError: true
      },
      [key("function")]: {
        type: "autocomplete",
        label: t("Function", "Funktion"),
        options: functions,
        freeSolo: true,
        onChange: { alsoDependsOn: [], calculateFunc: applyFunctionTemplate },
        onChangeDependsOn: [
          ...[
            "warning.enabled",
            "warning.mode",
            "warning.min",
            "warning.max",
            "alarm.enabled",
            "alarm.mode",
            "alarm.min",
            "alarm.max",
            "staleWarning.enabled",
            "staleWarning.minutes"
          ].map((path) => ({ attr: key(path), onChange: templateValue(path) }))
        ],
        help: functions.length ? t(`Existing functions: ${functions.join(", ")}`, `Vorhandene Funktionen: ${functions.join(", ")}`) : void 0,
        newLine: true,
        xs: 12
      },
      ...limits("warning", t("Warning limits", "Warngrenzen"), "#d6a500"),
      ...limits("alarm", t("Alarm limits", "Alarmgrenzen"), "#c62828"),
      [key("staleWarningHeader")]: sectionHeader(t("Update timeout", "Aktualisierungs-Timeout"), "#1976d2"),
      [key("staleWarning.enabled")]: {
        type: "checkbox",
        label: t("Warn if the state is not updated", "Warnen, wenn der State nicht aktualisiert wird"),
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
        hidden: `!${data("staleWarning.enabled")}`
      },
      [key("_saveAsTemplate")]: {
        type: "checkbox",
        label: t(
          "Save or update this selection as function template",
          "Diese Auswahl als Funktionsvorlage speichern oder aktualisieren"
        ),
        newLine: true,
        xs: 12
      }
    }
  };
}
function addStateDisabledRule(states) {
  const existingNames = JSON.stringify(states.map((state) => state.name.trim().toLowerCase()));
  return `!String(data.name || '').trim() || ${existingNames}.includes(String(data.name || '').trim().toLowerCase()) || !Array.isArray(data._validSourceIds) || !data._validSourceIds.includes(String(data.sourceId || '').trim())`;
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
  invalidSources = /* @__PURE__ */ new Set();
  sourceUnits = /* @__PURE__ */ new Map();
  updateHistoryQueues = /* @__PURE__ */ new Map();
  displayLanguage = "en";
  deviceManagement;
  sortRefreshTimer;
  staleCheckTimer;
  configurationBackupTimer;
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
    this.deviceManagement = new DeviceMonitoringManagement(this);
    const legacyDevices = this.normalizeDevices(this.config.devices);
    this.devices = legacyDevices.length ? legacyDevices : await this.loadDevicesFromObjects();
    if (!legacyDevices.length && !this.devices.length) {
      if (await this.restoreDeviceConfigurationBackup(false)) {
        this.log.info("Restored the device configuration from the instance backup");
      }
    }
    await this.ensureState("info.deviceInfo", t("Device information", "Ger\xE4teinformationen"), "string", "json");
    await this.rebuildObjects();
    if (legacyDevices.length) {
      await this.removeLegacyDeviceConfig();
    }
    await this.refreshSubscriptions();
    await this.initializeUpdateHistory(true);
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
  async onMessage(message) {
    var _a;
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
    const affectedDevices = /* @__PURE__ */ new Set();
    for (const device of this.devices) {
      for (const watched of device.states) {
        if (watched.sourceId === id) {
          await this.recordSourceUpdate(device, watched, state.ts);
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
          if (state) {
            await this.recordSourceUpdate(device, watched, state.ts);
          }
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
    const id = uniqueId(safeId(String(data.name), "state"), new Set(device.states.map((s) => s.id)));
    this.saveFunctionTemplate(data);
    await this.saveDevices(
      this.devices.map(
        (d) => d.id === deviceId ? { ...d, states: [...d.states, this.normalizeState(data, id)] } : d
      )
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
    await this.saveDevices(this.devices.map((entry) => entry.id === deviceId ? { ...entry, states } : entry));
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
      min: typeof (input == null ? void 0 : input.min) === "number" ? input.min : void 0,
      max: typeof (input == null ? void 0 : input.max) === "number" ? input.max : void 0
    });
    return {
      id,
      name: String(data.name || id).trim(),
      sourceId: String(data.sourceId || "").trim(),
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
  async saveDevices(devices) {
    var _a;
    this.devices = devices;
    await this.rebuildObjects();
    await this.removeLegacyDeviceConfig();
    await this.refreshSubscriptions();
    await this.initializeUpdateHistory();
    await this.updateAll();
    await ((_a = this.deviceManagement) == null ? void 0 : _a.refreshCards());
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
      await this.initializeUpdateHistory();
      await this.updateAll();
      await ((_a = this.deviceManagement) == null ? void 0 : _a.refreshCards());
      this.scheduleConfigurationBackup();
    }
    return true;
  }
  async rebuildObjects() {
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
      await this.setObjectAsync(`devices.${device.id}`, {
        type: "device",
        common: { name: device.name },
        native: {}
      });
      await this.ensureState(`devices.${device.id}.color`, t("Card color", "Kachelfarbe"), "string", "text");
      await this.ensureState(`devices.${device.id}.icon`, t("Card icon", "Kachelsymbol"), "string", "text");
      for (const watched of device.states) {
        expected.add(`${device.id}.${watched.id}`);
        const base = `devices.${device.id}.${watched.id}`;
        const unit = await this.getSourceUnit(watched.sourceId);
        await this.setObjectAsync(base, {
          type: "channel",
          common: { name: watched.name },
          native: { sourceId: watched.sourceId, function: watched.function }
        });
        await this.ensureState(`${base}.value`, t("Current value", "Aktueller Wert"), "mixed", "value", unit);
        await this.ensureState(`${base}.status`, t("Status", "Status"), "string", "text");
        await this.ensureState(`${base}.display`, t("Display value", "Anzeigewert"), "string", "text");
        await this.ensureState(
          `${base}.details`,
          t("Monitoring details", "\xDCberwachungsdetails"),
          "string",
          "html"
        );
        await this.ensureState(`${base}.warning`, t("Warning", "Warnung"), "boolean", "indicator");
        await this.ensureState(`${base}.alarm`, t("Alarm", "Alarm"), "boolean", "indicator.alarm");
        await this.ensureState(
          `${base}.updateTimeout`,
          t("Update timeout", "Aktualisierungs-Timeout"),
          "boolean",
          "indicator.maintenance"
        );
        await this.ensureState(
          `${base}.lastUpdate`,
          t("Last update", "Letzte Aktualisierung"),
          "number",
          "value.time"
        );
        await this.ensureState(
          `${base}.previousUpdate`,
          t("Previous update", "Vorherige Aktualisierung"),
          "number",
          "value.time"
        );
        await this.ensureState(
          `${base}.updateInterval`,
          t("Update interval", "Aktualisierungsintervall"),
          "number",
          "value.interval",
          "ms"
        );
        await this.ensureState(
          `${base}.lastUpdateDisplay`,
          t("Last update display", "Anzeige der letzten Aktualisierung"),
          "string",
          "text"
        );
        await this.ensureState(
          `${base}.previousUpdateDisplay`,
          t("Previous update display", "Anzeige der vorherigen Aktualisierung"),
          "string",
          "text"
        );
        await this.ensureState(
          `${base}.updateIntervalDisplay`,
          t("Update interval display", "Anzeige des Aktualisierungsintervalls"),
          "string",
          "text"
        );
        await this.ensureState(
          `${base}.updateHistorySource`,
          t("Update history source", "Quelle des Aktualisierungsverlaufs"),
          "string",
          "text"
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
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j;
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
          min: number((_c = template.warning) == null ? void 0 : _c.min),
          max: number((_d = template.warning) == null ? void 0 : _d.max)
        },
        alarm: {
          enabled: ((_e = template.alarm) == null ? void 0 : _e.enabled) === true,
          mode: mode((_f = template.alarm) == null ? void 0 : _f.mode),
          min: number((_g = template.alarm) == null ? void 0 : _g.min),
          max: number((_h = template.alarm) == null ? void 0 : _h.max)
        },
        staleWarning: {
          enabled: ((_i = template.staleWarning) == null ? void 0 : _i.enabled) === true,
          minutes: number((_j = template.staleWarning) == null ? void 0 : _j.minutes) || 60
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
  async ensureState(id, name, type, role, unit) {
    await this.setObjectAsync(id, {
      type: "state",
      common: { name, type, role, read: true, write: false, ...unit ? { unit } : {} },
      native: {}
    });
  }
  async refreshSubscriptions() {
    for (const id of this.subscribed) {
      this.unsubscribeForeignStates(id);
      this.unsubscribeForeignObjects(id);
    }
    this.subscribed = new Set(this.devices.flatMap((d) => d.states.map((s) => s.sourceId)).filter(Boolean));
    for (const id of this.subscribed) {
      this.subscribeForeignStates(id);
      this.subscribeForeignObjects(id);
    }
    await this.refreshSourceValidity();
  }
  isValidSourceObject(object) {
    return (object == null ? void 0 : object.type) === "state";
  }
  async getValidSourceIds() {
    const objects = await this.getForeignObjectsAsync("*", "state");
    return Object.keys(objects);
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
    const unit = (object == null ? void 0 : object.type) === "state" && typeof object.common.unit === "string" ? object.common.unit : "";
    this.sourceUnits.set(sourceId, unit);
    return unit;
  }
  async initializeUpdateHistory(resetAfterAdapterStart = false) {
    for (const device of this.devices) {
      for (const watched of device.states) {
        await this.ensureUpdateHistoryPlaceholders(device, watched);
        const state = await this.getForeignStateAsync(watched.sourceId);
        if (resetAfterAdapterStart) {
          await this.resetUpdateHistory(device, watched, state == null ? void 0 : state.ts);
        } else if (state) {
          await this.recordSourceUpdate(device, watched, state.ts);
        }
      }
    }
  }
  async resetUpdateHistory(device, watched, timestamp) {
    const base = `devices.${device.id}.${watched.id}`;
    const lastTimestamp = typeof timestamp === "number" && Number.isFinite(timestamp) && timestamp > 0 ? timestamp : null;
    await Promise.all([
      this.setStateChangedAsync(`${base}.updateHistorySource`, { val: watched.sourceId, ack: true }),
      this.setStateChangedAsync(`${base}.lastUpdate`, { val: lastTimestamp, ack: true }),
      this.setStateChangedAsync(`${base}.lastUpdateDisplay`, {
        val: this.localize(
          `Last timestamp: ${lastTimestamp === null ? "-" : timestampDisplay(lastTimestamp)}`,
          `Letzter Timestamp: ${lastTimestamp === null ? "-" : timestampDisplay(lastTimestamp)}`
        ),
        ack: true
      }),
      this.setStateChangedAsync(`${base}.previousUpdate`, { val: null, ack: true }),
      this.setStateChangedAsync(`${base}.previousUpdateDisplay`, {
        val: this.localize("Previous timestamp: -", "Vorletzter Timestamp: -"),
        ack: true
      }),
      this.setStateChangedAsync(`${base}.updateInterval`, { val: null, ack: true }),
      this.setStateChangedAsync(`${base}.updateIntervalDisplay`, {
        val: this.localize("Interval: -", "Intervall: -"),
        ack: true
      })
    ]);
  }
  async ensureUpdateHistoryPlaceholders(device, watched) {
    const base = `devices.${device.id}.${watched.id}`;
    const [last, previous, interval] = await Promise.all([
      this.getStateAsync(`${base}.lastUpdate`),
      this.getStateAsync(`${base}.previousUpdate`),
      this.getStateAsync(`${base}.updateInterval`)
    ]);
    const lastTimestamp = typeof (last == null ? void 0 : last.val) === "number" ? last.val : void 0;
    const previousTimestamp = typeof (previous == null ? void 0 : previous.val) === "number" ? previous.val : void 0;
    const updateInterval = typeof (interval == null ? void 0 : interval.val) === "number" ? interval.val : void 0;
    await Promise.all([
      this.setStateChangedAsync(`${base}.lastUpdateDisplay`, {
        val: this.localize(
          `Last timestamp: ${lastTimestamp === void 0 ? "-" : timestampDisplay(lastTimestamp)}`,
          `Letzter Timestamp: ${lastTimestamp === void 0 ? "-" : timestampDisplay(lastTimestamp)}`
        ),
        ack: true
      }),
      this.setStateChangedAsync(`${base}.previousUpdateDisplay`, {
        val: this.localize(
          `Previous timestamp: ${previousTimestamp === void 0 ? "-" : timestampDisplay(previousTimestamp)}`,
          `Vorletzter Timestamp: ${previousTimestamp === void 0 ? "-" : timestampDisplay(previousTimestamp)}`
        ),
        ack: true
      }),
      this.setStateChangedAsync(`${base}.updateIntervalDisplay`, {
        val: this.localize(
          `Interval: ${updateInterval === void 0 ? "-" : intervalDisplay(updateInterval)}`,
          `Intervall: ${updateInterval === void 0 ? "-" : intervalDisplay(updateInterval)}`
        ),
        ack: true
      })
    ]);
  }
  async recordSourceUpdate(device, watched, timestamp) {
    var _a;
    const key = `${device.id}.${watched.id}`;
    const previous = (_a = this.updateHistoryQueues.get(key)) != null ? _a : Promise.resolve();
    const current = previous.catch(() => void 0).then(() => this.recordSourceUpdateNow(device, watched, timestamp));
    this.updateHistoryQueues.set(key, current);
    try {
      await current;
    } finally {
      if (this.updateHistoryQueues.get(key) === current) {
        this.updateHistoryQueues.delete(key);
      }
    }
  }
  async recordSourceUpdateNow(device, watched, timestamp) {
    if (!Number.isFinite(timestamp) || timestamp <= 0) {
      return;
    }
    const base = `devices.${device.id}.${watched.id}`;
    const [sourceState, lastState] = await Promise.all([
      this.getStateAsync(`${base}.updateHistorySource`),
      this.getStateAsync(`${base}.lastUpdate`)
    ]);
    const sameSource = (sourceState == null ? void 0 : sourceState.val) === watched.sourceId;
    const lastTimestamp = sameSource && typeof (lastState == null ? void 0 : lastState.val) === "number" ? lastState.val : void 0;
    if (lastTimestamp !== void 0 && timestamp <= lastTimestamp) {
      return;
    }
    const previousTimestamp = lastTimestamp != null ? lastTimestamp : null;
    const interval = previousTimestamp === null ? null : timestamp - previousTimestamp;
    await Promise.all([
      this.setStateChangedAsync(`${base}.updateHistorySource`, { val: watched.sourceId, ack: true }),
      this.setStateChangedAsync(`${base}.lastUpdate`, { val: timestamp, ack: true }),
      this.setStateChangedAsync(`${base}.lastUpdateDisplay`, {
        val: this.localize(
          `Last timestamp: ${timestampDisplay(timestamp)}`,
          `Letzter Timestamp: ${timestampDisplay(timestamp)}`
        ),
        ack: true
      }),
      this.setStateChangedAsync(`${base}.previousUpdate`, { val: previousTimestamp, ack: true }),
      this.setStateChangedAsync(`${base}.previousUpdateDisplay`, {
        val: this.localize(
          `Previous timestamp: ${previousTimestamp === null ? "-" : timestampDisplay(previousTimestamp)}`,
          `Vorletzter Timestamp: ${previousTimestamp === null ? "-" : timestampDisplay(previousTimestamp)}`
        ),
        ack: true
      }),
      this.setStateChangedAsync(`${base}.updateInterval`, { val: interval, ack: true }),
      this.setStateChangedAsync(`${base}.updateIntervalDisplay`, {
        val: this.localize(
          `Interval: ${interval === null ? "-" : intervalDisplay(interval)}`,
          `Intervall: ${interval === null ? "-" : intervalDisplay(interval)}`
        ),
        ack: true
      })
    ]);
  }
  async updateAll() {
    for (const device of this.devices) {
      for (const watched of device.states) {
        const state = await this.getForeignStateAsync(watched.sourceId);
        if (state) {
          await this.recordSourceUpdate(device, watched, state.ts);
        }
        await this.updateValue(device, watched, state);
      }
      await this.updateDeviceSummary(device);
    }
    await this.updateDeviceInfo();
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
  async updateDetailsDisplay(device, watched, status, display, unit) {
    const base = `devices.${device.id}.${watched.id}`;
    const tooltip = [];
    if (watched.warning.enabled) {
      tooltip.push(
        this.localize(
          `Warning limit: ${limitDisplay(watched.warning, unit)}`,
          `Warngrenze: ${limitDisplay(watched.warning, unit)}`
        )
      );
    }
    if (watched.alarm.enabled) {
      tooltip.push(
        this.localize(
          `Alarm limit: ${limitDisplay(watched.alarm, unit)}`,
          `Alarmgrenze: ${limitDisplay(watched.alarm, unit)}`
        )
      );
    }
    if (watched.staleWarning.enabled) {
      tooltip.push(`Timeout: ${watched.staleWarning.minutes} min`);
    }
    const [last, interval] = await Promise.all([
      this.getStateAsync(`${base}.lastUpdate`),
      this.getStateAsync(`${base}.updateInterval`)
    ]);
    const lastTimestamp = typeof (last == null ? void 0 : last.val) === "number" ? timestampDisplay(last.val) : "-";
    const updateInterval = typeof (interval == null ? void 0 : interval.val) === "number" ? intervalDisplay(interval.val) : "-";
    const intervalLabel = this.localize("Interval:", "Intervall:");
    const title = tooltip.length ? ` title="${escapeHtml(tooltip.join("\n"))}"` : "";
    const details = `<div${title} style="width:268px;max-width:none;box-sizing:border-box;text-align:center;line-height:1.2;margin:4px 0 10px"><img src="${STATUS_ICONS[status]}" style="display:block;width:24px;height:24px;margin:0 auto 3px"><div style="color:${COLORS[status]}">${escapeHtml(display)}</div><div>LT: ${escapeHtml(lastTimestamp)}</div><div>${escapeHtml(intervalLabel)} ${escapeHtml(updateInterval)}</div></div>`;
    await this.setStateChangedAsync(`${base}.details`, { val: details, ack: true });
  }
  async updateValue(device, watched, sourceState) {
    var _a;
    const base = `devices.${device.id}.${watched.id}`;
    const value = (_a = sourceState == null ? void 0 : sourceState.val) != null ? _a : null;
    const updateTimedOut = (0, import_evaluation.isUpdateTimedOut)(sourceState, watched.staleWarning);
    const status = this.getWatchedStatus(watched, sourceState, updateTimedOut);
    const unit = await this.getSourceUnit(watched.sourceId);
    const display = status === "invalid" ? `${watched.name}: \u26A0 ${watched.sourceId}` : `${watched.name}: ${value === null ? "\u2014" : `${String(value)}${unit ? ` ${unit}` : ""}`}`;
    await Promise.all([
      this.setStateChangedAsync(`${base}.value`, { val: value, ack: true }),
      this.setStateChangedAsync(`${base}.status`, { val: status, ack: true }),
      this.setStateChangedAsync(`${base}.display`, {
        val: display,
        ack: true
      }),
      this.setStateChangedAsync(`${base}.warning`, { val: status === "warning", ack: true }),
      this.setStateChangedAsync(`${base}.alarm`, { val: status === "alarm", ack: true }),
      this.setStateChangedAsync(`${base}.updateTimeout`, { val: updateTimedOut, ack: true })
    ]);
    await this.updateDetailsDisplay(device, watched, status, display, unit);
  }
}
if (require.main !== module) {
  module.exports = (options) => new DeviceMonitoring(options);
} else {
  new DeviceMonitoring();
}
//# sourceMappingURL=main.js.map
