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
const t = (en, de) => ({ en, de });
const COLORS = {
  timeout: "#1976d2",
  alarm: "#c62828",
  warning: "#d6a500",
  ok: "#3f7d45",
  unknown: "#607d8b"
};
const svgIcon = (content) => `data:image/svg+xml,${encodeURIComponent(content)}`;
const STATUS_ICONS = {
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
          const data = await context.showForm(
            stateForm(this.adapter.getFunctionTemplates(), this.adapter.getFunctionNames()),
            {
              title: t("Add monitored state", "\xDCberwachungs-State hinzuf\xFCgen"),
              data: defaultStateForm(),
              buttons: ["apply", "cancel"]
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
          const data = await context.showForm(
            statesForm(device.states, this.adapter.getFunctionTemplates(), this.adapter.getFunctionNames()),
            {
              title: t("Edit monitored states", "\xDCberwachungs-States bearbeiten"),
              data: Object.fromEntries(device.states.map((watched) => [watched.id, watched])),
              buttons: ["apply", "cancel"]
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
    return {
      id: device.id,
      name: device.name,
      icon: { stateId: `${this.adapter.namespace}.devices.${device.id}.icon` },
      backgroundColor: { stateId: `${this.adapter.namespace}.devices.${device.id}.color` },
      indicators: device.states.map((watched, order) => ({
        id: `state_${watched.id}`,
        value: { stateId: `${this.adapter.namespace}.devices.${device.id}.${watched.id}.status` },
        icon: STATUS_ICONS.unknown,
        text: { stateId: `${this.adapter.namespace}.devices.${device.id}.${watched.id}.display` },
        levels: [
          { value: "timeout", color: "info", icon: STATUS_ICONS.timeout },
          { value: "alarm", color: "error", icon: STATUS_ICONS.alarm },
          { value: "warning", color: "warning", icon: STATUS_ICONS.warning },
          { value: "ok", color: "ok", icon: STATUS_ICONS.ok },
          { color: "inactive", icon: STATUS_ICONS.unknown }
        ],
        tooltip: watched.function || watched.name,
        hideIfEmpty: false,
        order
      })),
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
function defaultStateForm() {
  return {
    name: "",
    sourceId: "",
    function: "",
    warning: defaultLimit("outside"),
    alarm: defaultLimit("outside"),
    staleWarning: { enabled: false, minutes: 60 }
  };
}
function stateForm(functionTemplates, functionNames, stateId) {
  const functions = [.../* @__PURE__ */ new Set([...functionNames, ...Object.keys(functionTemplates)])].sort();
  const key = (path) => stateId ? `${stateId}.${path}` : path;
  const data = (path) => stateId ? `data[${JSON.stringify(stateId)}].${path}` : `data.${path}`;
  const templateValue = (prefix, field) => ({
    alsoDependsOn: [key("function")],
    calculateFunc: `(${JSON.stringify(functionTemplates)}[${data("function")}]?.${prefix}.${field} ?? ${data(`${prefix}.${field}`)})`,
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
      xs: 4,
      onChange: templateValue(prefix, "enabled")
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
      hidden: `!${data(`${prefix}.enabled`)}`,
      onChange: templateValue(prefix, "mode")
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
      [key("name")]: { type: "text", label: t("Name", "Name"), newLine: true, xs: 12 },
      [key("sourceId")]: {
        type: "objectId",
        label: t("ioBroker state", "ioBroker-State"),
        newLine: true,
        xs: 12,
        customFilter: { type: "state", common: { type: "number" } }
      },
      [key("function")]: {
        type: "autocomplete",
        label: t("Function", "Funktion"),
        options: functions,
        freeSolo: true,
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
        xs: 12,
        onChange: templateValue("staleWarning", "enabled")
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
        xs: 12,
        hidden: `!${data("function")}`
      }
    }
  };
}
function statesForm(states, functionTemplates, functionNames) {
  return {
    type: "tabs",
    items: Object.fromEntries(
      states.map((watched) => {
        const form = stateForm(functionTemplates, functionNames, watched.id);
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
  sourceUnits = /* @__PURE__ */ new Map();
  deviceManagement;
  sortRefreshTimer;
  staleCheckTimer;
  constructor(options = {}) {
    super({ ...options, name: "device-monitoring" });
    this.on("ready", this.onReady.bind(this));
    this.on("stateChange", this.onStateChange.bind(this));
    this.on("message", this.onMessage.bind(this));
    this.on("unload", (callback) => {
      if (this.sortRefreshTimer) {
        clearInterval(this.sortRefreshTimer);
      }
      if (this.staleCheckTimer) {
        clearInterval(this.staleCheckTimer);
      }
      callback();
    });
  }
  async onReady() {
    this.deviceManagement = new DeviceMonitoringManagement(this);
    const legacyDevices = this.normalizeDevices(this.config.devices);
    this.devices = legacyDevices.length ? legacyDevices : await this.loadDevicesFromObjects();
    await this.ensureState("info.deviceInfo", t("Device information", "Ger\xE4teinformationen"), "string", "json");
    await this.rebuildObjects();
    if (legacyDevices.length) {
      await this.removeLegacyDeviceConfig();
    }
    this.refreshSubscriptions();
    await this.updateAll();
    await this.setState("info.connection", true, true);
    this.sortRefreshTimer = setInterval(() => {
      var _a;
      void ((_a = this.deviceManagement) == null ? void 0 : _a.refreshCards());
    }, 1e4);
    this.staleCheckTimer = setInterval(() => {
      void this.updateAll();
    }, 6e4);
  }
  onMessage(message) {
    var _a;
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
  getFunctionTemplates() {
    return JSON.parse(JSON.stringify(this.functionTemplates));
  }
  getFunctionNames() {
    return [...new Set(this.devices.flatMap((device) => device.states.map((state) => state.function)).filter(Boolean))];
  }
  async getDevicesWithStatus() {
    const rank = { timeout: 0, alarm: 1, warning: 2, unknown: 3, ok: 4 };
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
    this.refreshSubscriptions();
    await this.updateAll();
    await ((_a = this.deviceManagement) == null ? void 0 : _a.refreshCards());
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
        await this.ensureState(`${base}.warning`, t("Warning", "Warnung"), "boolean", "indicator");
        await this.ensureState(`${base}.alarm`, t("Alarm", "Alarm"), "boolean", "indicator.alarm");
        await this.ensureState(
          `${base}.updateTimeout`,
          t("Update timeout", "Aktualisierungs-Timeout"),
          "boolean",
          "indicator.maintenance"
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
    var _a, _b, _c, _d, _e;
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
      templates[functionName] = {
        warning: { enabled: ((_a = template.warning) == null ? void 0 : _a.enabled) === true, mode: mode((_b = template.warning) == null ? void 0 : _b.mode) },
        alarm: { enabled: ((_c = template.alarm) == null ? void 0 : _c.enabled) === true, mode: mode((_d = template.alarm) == null ? void 0 : _d.mode) },
        staleWarning: { enabled: ((_e = template.staleWarning) == null ? void 0 : _e.enabled) === true }
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
  refreshSubscriptions() {
    for (const id of this.subscribed) {
      this.unsubscribeForeignStates(id);
    }
    this.subscribed = new Set(this.devices.flatMap((d) => d.states.map((s) => s.sourceId)).filter(Boolean));
    for (const id of this.subscribed) {
      this.subscribeForeignStates(id);
    }
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
  async updateAll() {
    for (const device of this.devices) {
      for (const watched of device.states) {
        await this.updateValue(device, watched, await this.getForeignStateAsync(watched.sourceId));
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
            var _a;
            const sourceState = await this.getForeignStateAsync(watched.sourceId);
            const updateTimeout = (0, import_evaluation.isUpdateTimedOut)(sourceState, watched.staleWarning);
            const status = (0, import_evaluation.getWatchStatus)(
              (_a = sourceState == null ? void 0 : sourceState.val) != null ? _a : null,
              watched.warning,
              watched.alarm,
              updateTimeout
            );
            return {
              id: watched.id,
              name: watched.name,
              sourceId: watched.sourceId,
              function: watched.function,
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
    var _a;
    const rank = { timeout: 0, alarm: 1, warning: 2, unknown: 3, ok: 4 };
    let status = "ok";
    for (const watched of device.states) {
      const state = await this.getForeignStateAsync(watched.sourceId);
      const current = (0, import_evaluation.getWatchStatus)(
        (_a = state == null ? void 0 : state.val) != null ? _a : null,
        watched.warning,
        watched.alarm,
        (0, import_evaluation.isUpdateTimedOut)(state, watched.staleWarning)
      );
      if (rank[current] < rank[status]) {
        status = current;
      }
    }
    return status;
  }
  async updateDeviceSummary(device) {
    const status = await this.getDeviceStatus(device);
    await Promise.all([
      this.setStateChangedAsync(`devices.${device.id}.color`, { val: COLORS[status], ack: true }),
      this.setStateChangedAsync(`devices.${device.id}.icon`, { val: STATUS_ICONS[status], ack: true })
    ]);
  }
  async updateValue(device, watched, sourceState) {
    var _a;
    const base = `devices.${device.id}.${watched.id}`;
    const value = (_a = sourceState == null ? void 0 : sourceState.val) != null ? _a : null;
    const updateTimedOut = (0, import_evaluation.isUpdateTimedOut)(sourceState, watched.staleWarning);
    const status = (0, import_evaluation.getWatchStatus)(value, watched.warning, watched.alarm, updateTimedOut);
    const unit = await this.getSourceUnit(watched.sourceId);
    await Promise.all([
      this.setStateChangedAsync(`${base}.value`, { val: value, ack: true }),
      this.setStateChangedAsync(`${base}.status`, { val: status, ack: true }),
      this.setStateChangedAsync(`${base}.display`, {
        val: `${watched.name}: ${value === null ? "\u2014" : `${String(value)}${unit ? ` ${unit}` : ""}`}`,
        ack: true
      }),
      this.setStateChangedAsync(`${base}.warning`, { val: status === "warning", ack: true }),
      this.setStateChangedAsync(`${base}.alarm`, { val: status === "alarm", ack: true }),
      this.setStateChangedAsync(`${base}.updateTimeout`, { val: updateTimedOut, ack: true })
    ]);
  }
}
if (require.main !== module) {
  module.exports = (options) => new DeviceMonitoring(options);
} else {
  new DeviceMonitoring();
}
//# sourceMappingURL=main.js.map
