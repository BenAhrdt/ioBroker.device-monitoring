![Logo](admin/device-monitoring.png)
# ioBroker.device-monitoring

[![NPM version](https://img.shields.io/npm/v/iobroker.device-monitoring.svg)](https://www.npmjs.com/package/iobroker.device-monitoring)
[![Downloads](https://img.shields.io/npm/dm/iobroker.device-monitoring.svg)](https://www.npmjs.com/package/iobroker.device-monitoring)
![Number of Installations](https://iobroker.live/badges/device-monitoring-installed.svg)
![Current version in stable repository](https://iobroker.live/badges/device-monitoring-stable.svg)

[![NPM](https://nodei.co/npm/iobroker.device-monitoring.png?downloads=true)](https://nodei.co/npm/iobroker.device-monitoring/)

**Tests:** ![Test and Release](https://github.com/BenAhrdt/ioBroker.device-monitoring/workflows/Test%20and%20Release/badge.svg)

## device-monitoring adapter for ioBroker

Watches your devined device states and build warnings and alerts

## Per-state notification levels

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
| `0` — Standard | Use the event's normal notification category |
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
| `category` | Notification category after applying the level: `deviceWarning`, `deviceAlarm`, `deviceTimeout`, `invalidSource`, `deviceRecovered`, `info`, `warnung` or `alarm` |
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

## Developer manual
This section is intended for the developer. It can be deleted later.

### DISCLAIMER

Please make sure that you consider copyrights and trademarks when you use names or logos of a company and add a disclaimer to your README.
You can check other adapters for examples or ask in the developer community. Using a name or logo of a company without permission may cause legal problems for you.

### Getting started

You are almost done, only a few steps left:
1. Create a new repository on GitHub with the name `ioBroker.device-monitoring`

1. Push all files to the GitHub repo. The creator has already set up the local repository for you:  
	```bash
	git push origin main
	```
1. Add a new secret under https://github.com/BenAhrdt/ioBroker.device-monitoring/settings/secrets. It must be named `AUTO_MERGE_TOKEN` and contain a personal access token with push access to the repository, e.g. yours. You can create a new token under https://github.com/settings/tokens.

1. Head over to [src/main.ts](src/main.ts) and start programming!

### Best Practices
We've collected some [best practices](https://github.com/ioBroker/ioBroker.repositories#development-and-coding-best-practices) regarding ioBroker development and coding in general. If you're new to ioBroker or Node.js, you should
check them out. If you're already experienced, you should also take a look at them - you might learn something new :)

### State Roles
When creating state objects, it is important to use the correct role for the state. The role defines how the state should be interpreted by visualizations and other adapters. For a list of available roles and their meanings, please refer to the [state roles documentation](https://www.iobroker.net/#en/documentation/dev/stateroles.md).

**Important:** Do not invent your own custom role names. If you need a role that is not part of the official list, please contact the ioBroker developer community for guidance and discussion about adding new roles.

### Scripts in `package.json`
Several npm scripts are predefined for your convenience. You can run them using `npm run <scriptname>`
| Script name | Description |
|-------------|-------------|
| `build` | Compile the TypeScript sources. |
| `watch` | Compile the TypeScript sources and watch for changes. |
| `test:ts` | Executes the tests you defined in `*.test.ts` files. |
| `test:package` | Ensures your `package.json` and `io-package.json` are valid. |
| `test:integration` | Tests the adapter startup with an actual instance of ioBroker. |
| `test` | Performs a minimal test run on package files and your tests. |
| `check` | Performs a type-check on your code (without compiling anything). |
| `lint` | Runs `ESLint` to check your code for formatting errors and potential bugs. |
| `translate` | Translates texts in your adapter to all required languages, see [`@iobroker/adapter-dev`](https://github.com/ioBroker/adapter-dev#manage-translations) for more details. |
| `release` | Creates a new release, see [`@alcalzone/release-script`](https://github.com/AlCalzone/release-script#usage) for more details. |

### Configuring the compilation
The adapter template uses [esbuild](https://esbuild.github.io/) to compile TypeScript and/or React code. You can configure many compilation settings 
either in `tsconfig.json` or by changing options for the build tasks. These options are described in detail in the
[`@iobroker/adapter-dev` documentation](https://github.com/ioBroker/adapter-dev#compile-adapter-files).

### Writing tests
When done right, testing code is invaluable, because it gives you the 
confidence to change your code while knowing exactly if and when 
something breaks. A good read on the topic of test-driven development 
is https://hackernoon.com/introduction-to-test-driven-development-tdd-61a13bc92d92. 
Although writing tests before the code might seem strange at first, but it has very 
clear upsides.

The template provides you with basic tests for the adapter startup and package files.
It is recommended that you add your own tests into the mix.

### Publishing the adapter
Using GitHub Actions, you can enable automatic releases on npm whenever you push a new git tag that matches the form 
`v<major>.<minor>.<patch>`. We **strongly recommend** that you do. The necessary steps are described in `.github/workflows/test-and-release.yml`.

Since you installed the release script, you can create a new
release simply by calling:
```bash
npm run release
```
Additional command line options for the release script are explained in the
[release-script documentation](https://github.com/AlCalzone/release-script#command-line).

To get your adapter released in ioBroker, please refer to the documentation 
of [ioBroker.repositories](https://github.com/ioBroker/ioBroker.repositories#requirements-for-adapter-to-get-added-to-the-latest-repository).

### Test the adapter manually with dev-server
Since you set up `dev-server`, you can use it to run, test and debug your adapter.

You may start `dev-server` by calling from your dev directory:
```bash
dev-server watch
```

The ioBroker.admin interface will then be available at http://localhost:undefined/

Please refer to the [`dev-server` documentation](https://github.com/ioBroker/dev-server#command-line) for more details.

## Changelog
<!--
	Placeholder for the next version (at the beginning of the line):
	### **WORK IN PROGRESS**
-->
### 0.0.21 (2026-09-21)
* (BenAhrdt) Add per-state notification levels with acknowledgements and document their values and the `info.message` event format

### 0.0.20 (2026-09-20)
* (BenAhrdt) Remove the separate Device Monitoring admin tab

### 0.0.19 (2026-09-20)
* (BenAhrdt) Show time-weighted averages inline with numeric values and show the average update interval beside the latest interval, ignoring sample gaps longer than an enabled update timeout

### 0.0.18 (2026-09-19)
* (BenAhrdt) Add an option to send configured notifications via notify while always publishing them to `info.message`.

### 0.0.17 (2026-09-19)
* (BenAhrdt) Update the default recovery notification message to identify the state and device.

### 0.0.16 (2026-09-19)
* (BenAhrdt) Show monitoring settings for the selected state type only after a valid source state is selected when adding a monitored state
* (BenAhrdt) Add editable notification title and message templates for warnings, alarms, timeouts, invalid sources and recoveries; show each pair under a color-coded header bar with a live sample preview, and reuse the rendered text for ioBroker notifications and single-event JSON in `info.message`, including mode-aware limits and optional remarks

### 0.0.15 (2026-09-18)
* (BenAhrdt) Add a "States suchen & hinzufügen" action to the Device Manager with role, name, state-ID and type filters, per-state target-device selection and editable display names
* (BenAhrdt) Support number and boolean source states, including decimal numeric limits and selectable boolean warning/alarm values
* (BenAhrdt) Configure numeric and boolean warning/alarm limits separately when a bulk selection contains both state types

### 0.0.14 (2026-09-18)
* (BenAhrdt) Keep the last ten update timestamps and show the previous timestamp, latest interval and average interval on device cards
* (BenAhrdt) Omit trailing zero-value units from displayed update intervals
* (BenAhrdt) Add configurable ioBroker notifications for warnings, alarms, timeouts, invalid sources and recoveries
* (BenAhrdt) Group monitored runtime values in an expert data channel with typed states and a JSON update history
* (BenAhrdt) Place the function-template option directly below the function selection
* (BenAhrdt) Use a stable expert HTML state for device-card details so newly added monitored states appear without rebuilding the card schema

### 0.0.13 (2026-09-17)
* (BenAhrdt) Display update timestamps in the adapter host's local system time instead of UTC

### 0.0.12 (2026-09-17)
* (BenAhrdt) Fix saving freely entered function names and their templates

### 0.0.11 (2026-09-17)
* (BenAhrdt) Add delayed and manual backup and restore of the device configuration
* (BenAhrdt) Reset update intervals on adapter start while retaining the current source timestamp
* (BenAhrdt) Always show the option to save or update a function template

### 0.0.10 (2026-09-17)
* (BenAhrdt) Show active limits, timeout settings, update timestamps and intervals on device cards
* (BenAhrdt) Accept existing mixed-type states while retaining runtime numeric-value checks

### 0.0.9 (2026-09-17)
* (BenAhrdt) Validate selected source states and mark deleted or invalid states on device cards

### 0.0.8 (2026-09-17)
* (BenAhrdt) Store and apply all limits and timeout values in function templates

### 0.0.7 (2026-09-17)
* (BenAhrdt) Fix applying activation and violation settings from selected function templates

### 0.0.6 (2026-09-17)
* (BenAhrdt) Add autocomplete suggestions for function templates
* (BenAhrdt) Improve and compact the monitored-state dialog layout
* (BenAhrdt) Clarify updating existing function templates

### 0.0.5 (2026-09-16)
* (BenAhrdt) Fix editing function names in the production Admin UI and enable trusted npm publishing

### 0.0.4 (2026-09-16)
* (BenAhrdt) Fix saving the function name and displaying the option to save it as a function template

### 0.0.3 (2026-09-16)
* (BenAhrdt) change Icon

### 0.0.2 (2026-09-16)
* (BenAhrdt) initial release

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
