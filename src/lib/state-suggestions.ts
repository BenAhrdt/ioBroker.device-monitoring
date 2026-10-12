import type { DeviceConfiguration } from './evaluation';

/** The subset of an ioBroker object needed to derive bulk-add suggestions. */
export interface StateSuggestionObject {
	/** ioBroker object type. */
	type?: string;
	/** Common object metadata. */
	common?: {
		/** Localized or plain object name. */
		name?: unknown;
		/** State data type, when the object is a state. */
		type?: unknown;
		/** State role, when the object is a state. */
		role?: unknown;
	};
}

/** All objects indexed by their ioBroker ID. */
export type StateSuggestionObjects = Record<string, StateSuggestionObject>;

/** Object hierarchy information for a source state. */
export interface SourceHierarchy {
	/** The immediate parent ID, used as a final grouping fallback. */
	parentId: string;
	/** The nearest ioBroker channel object above the state. */
	channelId: string;
	/** The nearest ioBroker device object above the state. */
	deviceId: string;
	/** Display name of the nearest channel, if available. */
	channelName: string;
	/** Display name of the nearest device, if available. */
	deviceName: string;
}

/** Existing monitoring assignment used to preserve source grouping. */
export interface MonitoredSourceSuggestion {
	/** Source state ID. */
	sourceId: string;
	/** Configured monitoring device ID. */
	deviceId: string;
	/** Configured monitored-state display name. */
	name: string;
	/** Source hierarchy used for grouping. */
	hierarchy: SourceHierarchy;
}

/**
 * Resolves a plain or localized ioBroker name with a deterministic fallback.
 *
 * @param value Plain or translated object name.
 * @param fallback Value used when no name is available.
 */
export function translatedObjectName(value: unknown, fallback: string): string {
	if (typeof value === 'string' && value.trim()) {
		return value.trim();
	}
	if (value && typeof value === 'object') {
		const translations = value as Record<string, unknown>;
		for (const language of ['de', 'en', 'ru']) {
			if (typeof translations[language] === 'string' && translations[language].trim()) {
				return translations[language].trim();
			}
		}
		const first = Object.values(translations).find(item => typeof item === 'string' && item.trim());
		if (typeof first === 'string') {
			return first.trim();
		}
	}
	return fallback;
}

/**
 * Returns the immediate parent ID of a state source.
 *
 * @param sourceId State source ID.
 */
export function sourceParentId(sourceId: string): string {
	const separator = sourceId.lastIndexOf('.');
	return separator > 0 ? sourceId.slice(0, separator) : '';
}

/**
 * Finds the nearest device and channel objects above a state source.
 *
 * @param sourceId State source ID.
 * @param objects Available ioBroker objects.
 */
export function sourceHierarchy(sourceId: string, objects: StateSuggestionObjects): SourceHierarchy {
	const parts = sourceId.split('.');
	let channelId = '';
	let deviceId = '';

	for (let length = parts.length - 1; length > 0; length--) {
		const parentId = parts.slice(0, length).join('.');
		const object = objects[parentId];
		if (object?.type === 'channel' && !channelId) {
			channelId = parentId;
		}
		if (object?.type === 'device' && !deviceId) {
			deviceId = parentId;
		}
		if (channelId && deviceId) {
			break;
		}
	}

	return {
		parentId: sourceParentId(sourceId),
		channelId,
		deviceId,
		channelName: channelId ? translatedObjectName(objects[channelId]?.common?.name, '') : '',
		deviceName: deviceId ? translatedObjectName(objects[deviceId]?.common?.name, '') : '',
	};
}

/**
 * Converts configured monitored states into source-group lookup entries.
 *
 * @param devices Existing monitoring devices.
 * @param objects Available ioBroker objects.
 */
export function monitoredSourceSuggestions(
	devices: DeviceConfiguration[],
	objects: StateSuggestionObjects,
): MonitoredSourceSuggestion[] {
	return devices.flatMap(device =>
		device.states.map(state => ({
			sourceId: state.sourceId,
			deviceId: device.id,
			name: state.name.trim(),
			hierarchy: sourceHierarchy(state.sourceId, objects),
		})),
	);
}

/**
 * Prefers the configured name for an existing source, otherwise its object name.
 *
 * @param sourceId State source ID.
 * @param stateObjectName Name from the source state object.
 * @param monitoredSources Existing monitored source assignments.
 */
export function suggestStateName(
	sourceId: string,
	stateObjectName: unknown,
	monitoredSources: MonitoredSourceSuggestion[],
): string {
	const existing = monitoredSources.find(source => source.sourceId === sourceId)?.name;
	if (existing) {
		return existing;
	}
	const fallback = sourceId.split('.').pop() || sourceId;
	return translatedObjectName(stateObjectName, fallback);
}

function uniqueDeviceId(sources: MonitoredSourceSuggestion[]): string | undefined {
	const deviceIds = [...new Set(sources.map(source => source.deviceId).filter(Boolean))];
	return deviceIds.length === 1 ? deviceIds[0] : undefined;
}

function configuredDeviceByName(
	name: string,
	devices: Pick<DeviceConfiguration, 'id' | 'name'>[],
): Pick<DeviceConfiguration, 'id' | 'name'> | undefined {
	const normalized = name.trim().toLocaleLowerCase();
	return normalized ? devices.find(device => device.name.trim().toLocaleLowerCase() === normalized) : undefined;
}

/**
 * Suggests the target-device form value for a source state.
 *
 * Existing assignments in the same source area win over names from the source
 * hierarchy. This keeps a configured grouping stable when more states are
 * added later. A source device or channel name is returned as free text when
 * no existing monitoring device can be resolved from that name.
 *
 * @param sourceId Source state ID.
 * @param objects Available ioBroker objects.
 * @param monitoredSources Existing monitored source assignments.
 * @param devices Existing monitoring devices.
 */
export function suggestTargetDevice(
	sourceId: string,
	objects: StateSuggestionObjects,
	monitoredSources: MonitoredSourceSuggestion[],
	devices: Pick<DeviceConfiguration, 'id' | 'name'>[],
): string {
	const hierarchy = sourceHierarchy(sourceId, objects);
	const exact = uniqueDeviceId(monitoredSources.filter(source => source.sourceId === sourceId));
	if (exact) {
		return exact;
	}

	const sameChannel = hierarchy.channelId
		? uniqueDeviceId(monitoredSources.filter(source => source.hierarchy.channelId === hierarchy.channelId))
		: undefined;
	if (sameChannel) {
		return sameChannel;
	}

	const sameDevice = hierarchy.deviceId
		? uniqueDeviceId(monitoredSources.filter(source => source.hierarchy.deviceId === hierarchy.deviceId))
		: undefined;
	if (sameDevice) {
		return sameDevice;
	}

	const sameParent = hierarchy.parentId
		? uniqueDeviceId(monitoredSources.filter(source => source.hierarchy.parentId === hierarchy.parentId))
		: undefined;
	if (sameParent) {
		return sameParent;
	}

	const sourceDevice = configuredDeviceByName(hierarchy.deviceName, devices);
	if (sourceDevice) {
		return sourceDevice.id;
	}
	const sourceChannel = configuredDeviceByName(hierarchy.channelName, devices);
	if (sourceChannel) {
		return sourceChannel.id;
	}
	if (hierarchy.deviceName) {
		return hierarchy.deviceName;
	}
	if (hierarchy.channelName) {
		return hierarchy.channelName;
	}
	return devices.length === 1 ? devices[0].id : '';
}
