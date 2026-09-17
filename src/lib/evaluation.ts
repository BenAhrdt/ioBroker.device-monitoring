export type LimitMode = 'below' | 'above' | 'outside' | 'inside';

/** Configuration of a numeric warning or alarm limit. */
export interface LimitConfiguration {
	/** Whether this limit is evaluated. */
	enabled: boolean;
	/** Determines how the configured boundary values are interpreted. */
	mode: LimitMode;
	/** Optional lower boundary. */
	min?: number;
	/** Optional upper boundary. */
	max?: number;
}

/** Persistent configuration of one monitored ioBroker state. */
export interface WatchedStateConfiguration {
	/** Stable identifier below the device object. */
	id: string;
	/** User-facing name of the monitored state. */
	name: string;
	/** Full ioBroker object ID of the source state. */
	sourceId: string;
	/** Function name used to group and reuse monitoring settings. */
	function: string;
	/** Warning-limit configuration. */
	warning: LimitConfiguration;
	/** Alarm-limit configuration. */
	alarm: LimitConfiguration;
	/** Update-timeout configuration. */
	staleWarning: StaleWarningConfiguration;
}

/** Configuration for detecting states that are no longer updated. */
export interface StaleWarningConfiguration {
	/** Whether update-timeout detection is enabled. */
	enabled: boolean;
	/** Maximum age of the source state in minutes. */
	minutes: number;
}

/** Persistent configuration of a monitored device. */
export interface DeviceConfiguration {
	/** Stable device identifier. */
	id: string;
	/** User-facing device name. */
	name: string;
	/** States monitored for this device. */
	states: WatchedStateConfiguration[];
}

/** Reusable activation and violation settings associated with a function name. */
export interface FunctionTemplate {
	/** Reusable warning activation and mode. */
	warning: Pick<LimitConfiguration, 'enabled' | 'mode'>;
	/** Reusable alarm activation and mode. */
	alarm: Pick<LimitConfiguration, 'enabled' | 'mode'>;
	/** Reusable update-timeout activation. */
	staleWarning: Pick<StaleWarningConfiguration, 'enabled'>;
}

/**
 * Extracts reusable settings from a monitored state.
 *
 * @param watched Full monitored-state configuration.
 * @returns Function template without state-specific thresholds and timeout duration.
 */
export function createFunctionTemplate(watched: WatchedStateConfiguration): FunctionTemplate {
	return {
		warning: { enabled: watched.warning.enabled, mode: watched.warning.mode },
		alarm: { enabled: watched.alarm.enabled, mode: watched.alarm.mode },
		staleWarning: { enabled: watched.staleWarning.enabled },
	};
}

export type WatchStatus = 'ok' | 'warning' | 'alarm' | 'timeout' | 'unknown';

/**
 * Checks whether a numeric state value violates a configured limit.
 *
 * @param value Current state value.
 * @param limit Limit configuration to evaluate.
 * @returns Whether the enabled limit is violated.
 */
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

/**
 * Determines the effective monitoring status, including its priority.
 *
 * @param value Current state value.
 * @param warning Warning-limit configuration.
 * @param alarm Alarm-limit configuration.
 * @param stale Whether the source state exceeded its update timeout.
 * @returns Effective status of the monitored state.
 */
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

/**
 * Checks whether a source state exceeded its configured maximum age.
 *
 * @param state Current source state, if available.
 * @param configuration Update-timeout configuration.
 * @param now Timestamp used as the comparison reference.
 * @returns Whether update-timeout detection is enabled and the state is stale.
 */
export function isUpdateTimedOut(
	state: ioBroker.State | null | undefined,
	configuration: StaleWarningConfiguration,
	now = Date.now(),
): boolean {
	return Boolean(
		configuration.enabled && configuration.minutes > 0 && state && now - state.ts >= configuration.minutes * 60_000,
	);
}
