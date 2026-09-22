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

Each monitored state has five writable level states under `devices.<deviceId>.<stateId>.level`:

| State | Event |
| --- | --- |
| `warning` | Warning limit reached |
| `alarm` | Alarm limit reached |
| `timeout` | Source update timeout |
| `invalid` | Source missing or invalid |
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
| `type` | Original event type: `warning`, `alarm`, `timeout`, `invalidSource` or `recovered` |
| `category` | Output notification category after applying the level: `info`, `warnung` or `alarm` |
| `title` | Rendered notification title |
| `message` | Rendered notification message |
| `deviceId`, `deviceName` | Device identifier and display name |
| `stateId`, `stateName` | Monitored state identifier and display name |
| `sourceId` | Source state ID |
| `remark` | Configured remark for the monitored state |
| `value`, `unit` | Current source value and its unit |
| `triggeredAt` | Event time as a Unix timestamp in milliseconds |
| `lastUpdate` | Last source update time as a Unix timestamp in milliseconds, or `null` |
| `timeoutMinutes` | Configured timeout duration; present for timeout events only |

The `type` field remains the original event type when its notification category is changed by a level. The `info.message` state is acknowledged (`ack = true`) by the adapter.
### Example
`http://192.168.0.222:8081/#tab-objects/select/device-monitoring.0.info.message`

```

{
  "type": "alarm", 
  "category": "deviceAlarm",
  "title": "Alarm: MClimate PIR Mini - Batterie",
  "deviceId": "device_001",
  "deviceName": "MClimate PIR Mini",
  "stateId": "batterie",
  "stateName": "Batterie",
  "sourceId": "lorawan.1.316cac7b-2bb0-4b11-aae1-41ea7448caec.devices.8c1f646ca3000066.uplink.decoded.BatteryPercent",
  "remark": "Der PIR Mini wird als externer Temperatur Sensor für das Vicki im Wohnzimmer genutzt",
  "value": 20,
  "unit": "%",
  "triggeredAt": 1790057552980,
  "lastUpdate": 1790057552976,
  "message": "Der State Batterie vom Gerät MClimate PIR Mini hat mit 20 % die konfigurierte Alarmgrenze (kleiner als 70 %) verletzt (Der PIR Mini wird als externer Temperatur Sensor für das Vicki im Wohnzimmer genutzt)"
}
```



### DISCLAIMER

## Changelog
<!--
	Placeholder for the next version (at the beginning of the line):
	### **WORK IN PROGRESS**
-->
### 0.0.26 (2026-09-22)
* (BenAhrdt) Link the historical changelog from the README.
* (BenAhrdt) Use only the general `info`, `warnung` and `alarm` categories for notification output while preserving the original event type in `info.message.type`.

### 0.0.25 (2026-09-21)
* (BenAhrdt) Exclude the historical changelog from the npm package and link to it from the README.

### 0.0.24 (2026-09-21)
* (BenAhrdt) Complete responsive widths for all Admin configuration fields.

### 0.0.23 (2026-09-21)
* (BenAhrdt) Fix responsive widths in the notification template settings.

### 0.0.22 (2026-09-21)
* (BenAhrdt) Require Admin 8 or newer, complete adapter metadata and required language entries, and update repository checks and scheduled dependency updates
* (BenAhrdt) Add a link from the instance configuration to the Device Manager tab

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
