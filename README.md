![Logo](admin/device-monitoring.png)
# ioBroker.device-monitoring

[![NPM version](https://img.shields.io/npm/v/iobroker.device-monitoring.svg)](https://www.npmjs.com/package/iobroker.device-monitoring)
[![Downloads](https://img.shields.io/npm/dm/iobroker.device-monitoring.svg)](https://www.npmjs.com/package/iobroker.device-monitoring)
![Number of Installations](https://iobroker.live/badges/device-monitoring-installed.svg)
![Current version in stable repository](https://iobroker.live/badges/device-monitoring-stable.svg)

[![NPM](https://nodei.co/npm/iobroker.device-monitoring.png?downloads=true)](https://nodei.co/npm/iobroker.device-monitoring/)

**Tests:** ![Test and Release](https://github.com/BenAhrdt/ioBroker.device-monitoring/workflows/Test%20and%20Release/badge.svg)

## device-monitoring adapter for ioBroker

Watches your defined device states and build warnings and alerts

<img width="1037" height="899" alt="image" src="https://github.com/user-attachments/assets/8ae6d145-90eb-437f-89b5-ce823d63f210" />


## Standard output categories

The standard output categories are mapped as follows:

| Event | Category |
| --- | --- |
| Warning limit reached | `warnung` |
| Alarm limit reached | `alarm` |
| Source update timeout | `alarm` |
| Source missing or invalid | `warnung` |
| State returned to normal | `info` |

## Per-state notification levels
This offers the possibility to deviate from the standard notification (for example, temporarily)

Each monitored state has six writable level states under `devices.<deviceId>.<stateId>.level`:

| State | Event |
| --- | --- |
| `warning` | Warning limit reached |
| `alarm` | Alarm limit reached |
| `timeout` | Source update timeout |
| `invalid` | Source ID missing or deleted |
| `invalidValue` | Source exists but provides an invalid value |
| `recovered` | State returned to normal |

Each level state accepts these values:

| Value | Meaning |
| --- | --- |
| `0` — Standard | Use the event's standard notification category |
| `1` — Disabled | Suppress this event |
| `2` — Info | Send the event with the `info` category |
| `3` — Warning | Send the event with the `warnung` category |
| `4` — Alarm | Send the event with the `alarm` category |

The adapter acknowledges recognized values from `0` to `4` by writing the selected value back with `ack = true`.



## `info.message` state

The read-only `info.message` state contains a JSON string for the latest notification event. Each new event replaces the previous one; this state is not a history. Events are written here even when sending notifications via `notify` is disabled. A level set to `Disabled` suppresses the event entirely.

The JSON object contains these fields:

| Field | Description |
| --- | --- |
| `type` | Original event type: `warning`, `alarm`, `timeout`, `invalidSource`, `invalidValue` or `recovered`; recurring summaries use `summary` |
| `category` | Output notification category after applying the level: `info`, `warnung` or `alarm` |
| `title` | Rendered notification title |
| `message` | Rendered notification message |
| `deviceId`, `deviceName` | Device identifier and display name |
| `stateId`, `stateName` | Monitored state identifier and display name |
| `function` | Configured monitoring function name; empty when no function is assigned |
| `sourceId` | Source state ID |
| `remark` | Configured remark for the monitored state |
| `value`, `unit` | Current source value and its unit |
| `triggeredAt` | Event time as a Unix timestamp in milliseconds |
| `lastUpdate` | Last source update time as a Unix timestamp in milliseconds, or `null` |
| `timeoutMinutes` | Configured timeout duration; present for timeout events only |

The `type` field remains the original event type when its notification category is changed by a level. The `info.message` state is acknowledged (`ack = true`) by the adapter.

## Recurring reminders

The Notifications section can enable recurring reminders. The schedule is configured with a Cron selector, and the selected `info`, `warnung` or `alarm` category is used for the summary. At each scheduled time, the adapter checks all monitored states and sends one summary for every currently non-normal state (`warning`, `alarm`, `timeout`, `invalid` or `invalidValue`). If all states are normal, no reminder is sent. The summary stored in `info.message` contains only `type`, `category`, `title` and `message`.

### Example
`http://192.168.0.222:8081/#tab-objects/select/device-monitoring.0.info.message`

```

{
  "type": "timeout",
  "category": "alarm",
  "title": "Aktualisierungs-Timeout: Timmerflotte Schlafzimmer - Temperatur",
  "deviceId": "device_002",
  "deviceName": "Timmerflotte Schlafzimmer",
  "stateId": "timmerflotte_schlafzimmer",
  "stateName": "Temperatur",
  "sourceId": "lorawan.0.bridge.devices.70c0cc1b11042a812825444dc65d04f5.sensor.schlafzimmer_timmerflotte_temperatur",
  "remark": "",
  "value": 21.39,
  "unit": "°C",
  "triggeredAt": 1790071578722,
  "lastUpdate": 1790071509083,
  "timeoutMinutes": 1,
  "message": "Der State Temperatur vom Gerät Timmerflotte Schlafzimmer hat sich mindestens 1 Minuten nicht gemeldet. Letzte Aktualisierung: 2026-09-22 12:05:09.083"
}

```
### Use Notify Levels in the Notification Manager

<img width="797" height="331" alt="image" src="https://github.com/user-attachments/assets/1772680b-68ab-45d3-947e-4d43610c92b4" />

### Use Notify Levels in (Blockly) Scripts

<img width="1232" height="725" alt="image" src="https://github.com/user-attachments/assets/2d1229ec-ed2b-4974-9625-3be823a8f392" />

### Result (Example)

<img width="591" height="1280" alt="image" src="https://github.com/user-attachments/assets/f6c94e61-a233-4c17-8792-f898b34e80e3" />



### DISCLAIMER

## Changelog
<!--
	Placeholder for the next version (at the beginning of the line):
	### **WORK IN PROGRESS**
-->
### **WORK IN PROGRESS**
* (BenAhrdt) Add configurable Cron-based reminders with a summary of all currently non-normal monitored states.

### 0.0.28 (2026-09-23)
* (BenAhrdt) Keep monitored state names unchanged in the edit dialog and add the recommended translations to generated object names.
* (BenAhrdt) Set generated monitored value states to the source state's `boolean` or `number` type.
* (BenAhrdt) Use the writable `level` role for notification-level states.
* (BenAhrdt) Use the `sensor` role for boolean monitored value states while keeping `value` for numeric states.

### 0.0.27 (2026-09-23)
* (BenAhrdt) Distinguish missing source IDs from invalid source values, add configurable invalid-value notifications, update the monitored value state first, and include the configured function in `info.message`.
* (BenAhrdt) Match notification-template header colors to their standard output categories.

### 0.0.26 (2026-09-22)
* (BenAhrdt) Link the historical changelog from the README.
* (BenAhrdt) Use only the general `info`, `warnung` and `alarm` categories for notification output while preserving the original event type in `info.message.type`.

### 0.0.25 (2026-09-21)
* (BenAhrdt) Exclude the historical changelog from the npm package and link to it from the README.

### 0.0.24 (2026-09-21)
* (BenAhrdt) Complete responsive widths for all Admin configuration fields.

[Older changelog entries](CHANGELOG_OLD.md)

## License
MIT License

Copyright (c) 2026 BenAhrdt <github@ben-schmidt.net>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
