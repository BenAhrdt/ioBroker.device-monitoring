export type LimitMode = 'below' | 'above' | 'outside' | 'inside';

/** Configuration of a numeric or boolean warning/alarm limit. */
export interface LimitConfiguration {
	/** Whether this limit is evaluated. */
	enabled: boolean;
	/** Determines how the configured boundary values are interpreted. */
	mode: LimitMode;
	/** Boolean value which activates the limit for boolean source states. */
	booleanValue?: boolean;
	/** Optional lower boundary. */
	min?: number;
	/** Optional upper boundary. */
	max?: number;
	/** Optional time in minutes the violation must persist before activation. */
	responseDelayMinutes?: number;
}

/** Persisted start times of currently violated limits. */
export interface LimitActivationState {
	/** Start of the current warning violation. */
	warningSince: number | null;
	/** Start of the current alarm violation. */
	alarmSince: number | null;
	/** Configuration signature used for the warning timer. */
	warningSignature?: string;
	/** Configuration signature used for the alarm timer. */
	alarmSignature?: string;
}

/** Persistent configuration of one monitored ioBroker state. */
export interface WatchedStateConfiguration {
	/** Stable identifier below the device object. */
	id: string;
	/** User-facing name of the monitored state. */
	name: string;
	/** Full ioBroker object ID of the source state. */
	sourceId: string;
	/** Optional user note included in notification templates. */
	remark?: string;
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

/** Complete reusable monitoring settings associated with a function name. */
export interface FunctionTemplate {
	/** Reusable warning configuration. */
	warning: LimitConfiguration;
	/** Reusable alarm configuration. */
	alarm: LimitConfiguration;
	/** Reusable update-timeout configuration. */
	staleWarning: StaleWarningConfiguration;
}

/**
 * Extracts reusable settings from a monitored state.
 *
 * @param watched Full monitored-state configuration.
 * @returns Complete reusable monitoring configuration.
 */
export function createFunctionTemplate(watched: WatchedStateConfiguration): FunctionTemplate {
	return {
		warning: { ...watched.warning },
		alarm: { ...watched.alarm },
		staleWarning: { ...watched.staleWarning },
	};
}

export type WatchStatus = 'ok' | 'warning' | 'alarm' | 'timeout' | 'invalid' | 'invalidValue' | 'unknown';

/**
 * Checks whether a numeric state value violates a configured limit.
 *
 * @param value Current state value.
 * @param limit Limit configuration to evaluate.
 * @returns Whether the enabled limit is violated.
 */
export function evaluateLimit(value: ioBroker.StateValue, limit: LimitConfiguration): boolean {
	if (!limit.enabled) {
		return false;
	}
	if (typeof value === 'boolean') {
		return limit.booleanValue !== undefined && value === limit.booleanValue;
	}
	if (typeof value !== 'number' || !Number.isFinite(value)) {
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
 * @param activation Persisted start times of active limit violations.
 * @param now Timestamp used as the comparison reference.
 * @returns Effective status of the monitored state.
 */
export function getWatchStatus(
	value: ioBroker.StateValue,
	warning: LimitConfiguration,
	alarm: LimitConfiguration,
	stale = false,
	activation?: LimitActivationState,
	now = Date.now(),
): WatchStatus {
	if (stale) {
		return 'timeout';
	}
	if ((typeof value !== 'number' || !Number.isFinite(value)) && typeof value !== 'boolean') {
		return 'invalidValue';
	}
	if (isLimitActive(value, alarm, activation?.alarmSince, now)) {
		return 'alarm';
	}
	if (isLimitActive(value, warning, activation?.warningSince, now)) {
		return 'warning';
	}
	return 'ok';
}

function isLimitActive(
	value: ioBroker.StateValue,
	limit: LimitConfiguration,
	since: number | null | undefined,
	now: number,
): boolean {
	if (!evaluateLimit(value, limit)) {
		return false;
	}
	const responseDelayMinutes = limit.responseDelayMinutes;
	if (
		typeof responseDelayMinutes !== 'number' ||
		!Number.isFinite(responseDelayMinutes) ||
		responseDelayMinutes <= 0
	) {
		return true;
	}
	return typeof since === 'number' && now - since >= responseDelayMinutes * 60_000;
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
