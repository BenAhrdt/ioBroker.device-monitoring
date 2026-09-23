# Older changelog entries
## 0.0.22 (2026-09-21)
* (BenAhrdt) Require Admin 8 or newer, complete adapter metadata and required language entries, and update repository checks and scheduled dependency updates
* (BenAhrdt) Add a link from the instance configuration to the Device Manager tab

## 0.0.21 (2026-09-21)
* (BenAhrdt) Add per-state notification levels with acknowledgements and document their values and the `info.message` event format

## 0.0.20 (2026-09-20)
* (BenAhrdt) Remove the separate Device Monitoring admin tab

## 0.0.19 (2026-09-20)
* (BenAhrdt) Show time-weighted averages inline with numeric values and show the average update interval beside the latest interval, ignoring sample gaps longer than an enabled update timeout

## 0.0.18 (2026-09-19)
* (BenAhrdt) Add an option to send configured notifications via notify while always publishing them to `info.message`.

## 0.0.17 (2026-09-19)
* (BenAhrdt) Update the default recovery notification message to identify the state and device.

## 0.0.16 (2026-09-19)
* (BenAhrdt) Show monitoring settings for the selected state type only after a valid source state is selected when adding a monitored state
* (BenAhrdt) Add editable notification title and message templates for warnings, alarms, timeouts, invalid sources and recoveries; show each pair under a color-coded header bar with a live sample preview, and reuse the rendered text for ioBroker notifications and single-event JSON in `info.message`, including mode-aware limits and optional remarks

## 0.0.15 (2026-09-18)
* (BenAhrdt) Add a "States suchen & hinzufügen" action to the Device Manager with role, name, state-ID and type filters, per-state target-device selection and editable display names
* (BenAhrdt) Support number and boolean source states, including decimal numeric limits and selectable boolean warning/alarm values
* (BenAhrdt) Configure numeric and boolean warning/alarm limits separately when a bulk selection contains both state types

## 0.0.14 (2026-09-18)
* (BenAhrdt) Keep the last ten update timestamps and show the previous timestamp, latest interval and average interval on device cards
* (BenAhrdt) Omit trailing zero-value units from displayed update intervals
* (BenAhrdt) Add configurable ioBroker notifications for warnings, alarms, timeouts, invalid sources and recoveries
* (BenAhrdt) Group monitored runtime values in an expert data channel with typed states and a JSON update history
* (BenAhrdt) Place the function-template option directly below the function selection
* (BenAhrdt) Use a stable expert HTML state for device-card details so newly added monitored states appear without rebuilding the card schema

## 0.0.13 (2026-09-17)
* (BenAhrdt) Display update timestamps in the adapter host's local system time instead of UTC

## 0.0.12 (2026-09-17)
* (BenAhrdt) Fix saving freely entered function names and their templates

## 0.0.11 (2026-09-17)
* (BenAhrdt) Add delayed and manual backup and restore of the device configuration
* (BenAhrdt) Reset update intervals on adapter start while retaining the current source timestamp
* (BenAhrdt) Always show the option to save or update a function template

## 0.0.10 (2026-09-17)
* (BenAhrdt) Show active limits, timeout settings, update timestamps and intervals on device cards
* (BenAhrdt) Accept existing mixed-type states while retaining runtime numeric-value checks

## 0.0.9 (2026-09-17)
* (BenAhrdt) Validate selected source states and mark deleted or invalid states on device cards

## 0.0.8 (2026-09-17)
* (BenAhrdt) Store and apply all limits and timeout values in function templates

## 0.0.7 (2026-09-17)
* (BenAhrdt) Fix applying activation and violation settings from selected function templates

## 0.0.6 (2026-09-17)
* (BenAhrdt) Add autocomplete suggestions for function templates
* (BenAhrdt) Improve and compact the monitored-state dialog layout
* (BenAhrdt) Clarify updating existing function templates

## 0.0.5 (2026-09-16)
* (BenAhrdt) Fix editing function names in the production Admin UI and enable trusted npm publishing

## 0.0.4 (2026-09-16)
* (BenAhrdt) Fix saving the function name and displaying the option to save it as a function template

## 0.0.3 (2026-09-16)
* (BenAhrdt) change Icon

## 0.0.2 (2026-09-16)
* (BenAhrdt) initial release
