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
var reminders_exports = {};
__export(reminders_exports, {
  createNotificationCollectionSummaryMessage: () => createNotificationCollectionSummaryMessage,
  createSummaryReminderMessage: () => createSummaryReminderMessage,
  summaryCategoryForItems: () => summaryCategoryForItems
});
module.exports = __toCommonJS(reminders_exports);
var import_notifications = require("./notifications");
function timestampDisplay(timestamp) {
  if (timestamp === null) {
    return "\u2014";
  }
  const date = new Date(timestamp);
  const pad = (value, length = 2) => String(value).padStart(length, "0");
  const formatted = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  return formatted;
}
function statusLabel(status, language) {
  if (language === "de") {
    switch (status) {
      case "warning":
        return "Warnung";
      case "alarm":
        return "Alarm";
      case "timeout":
        return "Timeout";
      case "invalid":
        return "Ung\xFCltige Quelle";
      case "invalidValue":
        return "Ung\xFCltiger Wert";
      default:
        return "Nicht normal";
    }
  }
  switch (status) {
    case "warning":
      return "Warning";
    case "alarm":
      return "Alarm";
    case "timeout":
      return "Timeout";
    case "invalid":
      return "Invalid source";
    case "invalidValue":
      return "Invalid value";
    default:
      return "Not normal";
  }
}
function valueDisplay(value, unit) {
  if (value === null || value === void 0) {
    return "\u2014";
  }
  return `${String(value)}${unit ? ` ${unit}` : ""}`;
}
function createSummaryReminderMessage(items, language) {
  if (!items.length) {
    return void 0;
  }
  const title = language === "de" ? "Erinnerung: Aktive Ger\xE4tezust\xE4nde" : "Reminder: Active device states";
  const heading = language === "de" ? "Folgende \xFCberwachte Zust\xE4nde sind aktuell nicht normal:" : "The following monitored states are currently not normal:";
  const lines = items.map((item) => {
    let detail = `${statusLabel(item.status, language)}: ${valueDisplay(item.value, item.unit)}`;
    if (item.status === "timeout") {
      detail = `${statusLabel(item.status, language)} (${language === "de" ? "letzte Aktualisierung" : "last update"}: ${timestampDisplay(item.lastUpdate)})`;
    } else if (item.status === "invalid") {
      detail = `${statusLabel(item.status, language)}: ${item.sourceId}`;
    }
    return `- ${item.deviceName} / ${item.stateName}: ${detail}`;
  });
  return { title, message: `${heading}
${lines.join("\n")}` };
}
function summaryCategoryForItems(items) {
  return (0, import_notifications.highestNotificationCategory)(items.map((item) => (0, import_notifications.notificationCategoryForStatus)(item.status)));
}
function categoryLabel(category, language) {
  if (language === "de") {
    switch (category) {
      case "alarm":
        return "Alarm";
      case "warnung":
        return "Warnung";
      case "info":
        return "Info";
    }
  }
  switch (category) {
    case "alarm":
      return "Alarm";
    case "warnung":
      return "Warning";
    case "info":
      return "Info";
  }
}
function createNotificationCollectionSummaryMessage(items, language, startedAt, endedAt) {
  if (!items.length) {
    return void 0;
  }
  const title = language === "de" ? "Sammelbericht: Benachrichtigungen" : "Collected notification summary";
  const heading = language === "de" ? `Im Zeitraum ${timestampDisplay(startedAt)} bis ${timestampDisplay(endedAt)} traten folgende Ereignisse auf:` : `The following events occurred between ${timestampDisplay(startedAt)} and ${timestampDisplay(endedAt)}:`;
  const lines = items.map((item) => {
    const message = item.message.replace(/\s*\n\s*/g, " ").trim();
    return `- [${categoryLabel(item.category, language)}] ${timestampDisplay(item.triggeredAt)} ${item.deviceName} / ${item.stateName}: ${message}`;
  });
  return { title, message: `${heading}
${lines.join("\n")}` };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  createNotificationCollectionSummaryMessage,
  createSummaryReminderMessage,
  summaryCategoryForItems
});
//# sourceMappingURL=reminders.js.map
