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
const RESPONSE_TIME_LABELS = {
  en: { label: "Response time", minute: "minute", minutes: "minutes", second: "second", seconds: "seconds" },
  de: { label: "Ansprechzeit", minute: "Minute", minutes: "Minuten", second: "Sekunde", seconds: "Sekunden" },
  ru: { label: "\u0412\u0440\u0435\u043C\u044F \u043E\u0442\u043A\u043B\u0438\u043A\u0430", minute: "\u043C\u0438\u043D\u0443\u0442\u0430", minutes: "\u043C\u0438\u043D\u0443\u0442", second: "\u0441\u0435\u043A\u0443\u043D\u0434\u0430", seconds: "\u0441\u0435\u043A\u0443\u043D\u0434" },
  pt: { label: "Tempo de resposta", minute: "minuto", minutes: "minutos", second: "segundo", seconds: "segundos" },
  nl: { label: "Responstijd", minute: "minuut", minutes: "minuten", second: "seconde", seconds: "seconden" },
  fr: { label: "Temps de r\xE9ponse", minute: "minute", minutes: "minutes", second: "seconde", seconds: "secondes" },
  it: { label: "Tempo di risposta", minute: "minuto", minutes: "minuti", second: "secondo", seconds: "secondi" },
  es: { label: "Tiempo de respuesta", minute: "minuto", minutes: "minutos", second: "segundo", seconds: "segundos" },
  pl: { label: "Czas odpowiedzi", minute: "minuta", minutes: "minut", second: "sekunda", seconds: "sekund" },
  uk: { label: "\u0427\u0430\u0441 \u0432\u0456\u0434\u043F\u043E\u0432\u0456\u0434\u0456", minute: "\u0445\u0432\u0438\u043B\u0438\u043D\u0430", minutes: "\u0445\u0432\u0438\u043B\u0438\u043D", second: "\u0441\u0435\u043A\u0443\u043D\u0434\u0430", seconds: "\u0441\u0435\u043A\u0443\u043D\u0434" },
  "zh-cn": { label: "\u54CD\u5E94\u65F6\u95F4", minute: "\u5206\u949F", minutes: "\u5206\u949F", second: "\u79D2", seconds: "\u79D2" }
};
function formatResponseTimeSuffix(minutes, language) {
  if (typeof minutes !== "number" || !Number.isFinite(minutes) || minutes <= 0) {
    return "";
  }
  const labels = RESPONSE_TIME_LABELS[language];
  return ` (${labels.label} ${minutes} ${minutes === 1 ? labels.minute : labels.minutes})`;
}
function formatInvalidResponseTimeSuffix(seconds, language) {
  if (typeof seconds !== "number" || !Number.isFinite(seconds) || seconds <= 0) {
    return "";
  }
  const labels = RESPONSE_TIME_LABELS[language];
  const unit = seconds === 1 ? labels.second : labels.seconds;
  return ` (${labels.label} ${seconds} ${unit})`;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  formatInvalidResponseTimeSuffix,
  formatResponseTimeSuffix
});
//# sourceMappingURL=message-templates.js.map
