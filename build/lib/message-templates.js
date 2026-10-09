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
var message_templates_exports = {};
__export(message_templates_exports, {
  formatInvalidResponseTimeSuffix: () => formatInvalidResponseTimeSuffix,
  formatResponseTimeSuffix: () => formatResponseTimeSuffix
});
module.exports = __toCommonJS(message_templates_exports);
function formatResponseTimeSuffix(minutes, language) {
  if (typeof minutes !== "number" || !Number.isFinite(minutes) || minutes <= 0) {
    return "";
  }
  return language === "de" ? ` (Ansprechzeit ${minutes} Minuten)` : ` (Response time ${minutes} minutes)`;
}
function formatInvalidResponseTimeSuffix(seconds, language) {
  if (typeof seconds !== "number" || !Number.isFinite(seconds) || seconds <= 0) {
    return "";
  }
  const unit = seconds === 1 ? language === "de" ? "Sekunde" : "second" : language === "de" ? "Sekunden" : "seconds";
  return language === "de" ? ` (Ansprechzeit ${seconds} ${unit})` : ` (Response time ${seconds} ${unit})`;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  formatInvalidResponseTimeSuffix,
  formatResponseTimeSuffix
});
//# sourceMappingURL=message-templates.js.map
