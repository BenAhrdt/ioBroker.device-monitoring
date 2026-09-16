export type LimitMode = 'below' | 'above' | 'outside' | 'inside';

export interface LimitConfiguration {
	enabled: boolean;
	mode: LimitMode;
	min?: number;
	max?: number;
}

export interface WatchedStateConfiguration {
	id: string;
	name: string;
	sourceId: string;
	function: string;
	warning: LimitConfiguration;
	alarm: LimitConfiguration;
	staleWarning: StaleWarningConfiguration;
}

export interface StaleWarningConfiguration {
	enabled: boolean;
	minutes: number;
}

export interface DeviceConfiguration {
	id: string;
	name: string;
	states: WatchedStateConfiguration[];
}

export type FunctionProfile = Pick<WatchedStateConfiguration, 'warning' | 'alarm' | 'staleWarning'>;

/**
 * Builds the templates offered by the function autocomplete.
 *
 * Configuration order is significant: the last state using a function is its
 * current template. A state being edited can be preferred explicitly so opening
 * its form never replaces its limits with those of another state with the same
 * function.
 */
export function getFunctionProfiles(
	devices: DeviceConfiguration[],
	preferred?: WatchedStateConfiguration,
): Record<string, FunctionProfile> {
	const profiles: Record<string, FunctionProfile> = {};
	const add = (watched: WatchedStateConfiguration): void => {
		if (watched.function) {
			profiles[watched.function] = {
				warning: { ...watched.warning },
				alarm: { ...watched.alarm },
				staleWarning: { ...watched.staleWarning },
			};
		}
	};
	for (const device of devices) {
		for (const watched of device.states) {
			add(watched);
		}
	}
	if (preferred) {
		add(preferred);
	}
	return profiles;
}

export type WatchStatus = 'ok' | 'warning' | 'alarm' | 'timeout' | 'unknown';

export function evaluateLimit(value: ioBroker.StateValue, limit: LimitConfiguration): boolean {
	if (!limit.enabled || typeof value !== 'number' || !Number.isFinite(value)) {
		return false;
	}
	if (limit.mode === 'below') {
		return limit.min !== undefined && value < limit.min;
	}
	if (limit.mode === 'above') {
		return limit.max !== undefined && value > limit.max;
	}
	if (limit.min === undefined || limit.max === undefined) {
		return false;
	}
	return limit.mode === 'outside' ? value < limit.min || value > limit.max : value >= limit.min && value <= limit.max;
}

export function getWatchStatus(
	value: ioBroker.StateValue,
	warning: LimitConfiguration,
	alarm: LimitConfiguration,
	stale = false,
): WatchStatus {
	if (stale) {
		return 'timeout';
	}
	if (typeof value !== 'number' || !Number.isFinite(value)) {
		return 'unknown';
	}
	if (evaluateLimit(value, alarm)) {
		return 'alarm';
	}
	if (evaluateLimit(value, warning)) {
		return 'warning';
	}
	return 'ok';
}

export function isUpdateTimedOut(
	state: ioBroker.State | null | undefined,
	configuration: StaleWarningConfiguration,
	now = Date.now(),
): boolean {
	return Boolean(
		configuration.enabled && configuration.minutes > 0 && state && now - state.ts >= configuration.minutes * 60_000,
	);
}
