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

export interface FunctionTemplate {
	warning: Pick<LimitConfiguration, 'enabled' | 'mode'>;
	alarm: Pick<LimitConfiguration, 'enabled' | 'mode'>;
	staleWarning: Pick<StaleWarningConfiguration, 'enabled'>;
}

export function createFunctionTemplate(watched: WatchedStateConfiguration): FunctionTemplate {
	return {
		warning: { enabled: watched.warning.enabled, mode: watched.warning.mode },
		alarm: { enabled: watched.alarm.enabled, mode: watched.alarm.mode },
		staleWarning: { enabled: watched.staleWarning.enabled },
	};
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
