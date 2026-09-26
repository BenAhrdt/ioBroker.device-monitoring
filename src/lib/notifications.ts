import type { WatchStatus } from './evaluation';

export const NOTIFICATION_CATEGORIES = [
	'deviceWarning',
	'deviceAlarm',
	'deviceTimeout',
	'invalidSource',
	'invalidValue',
	'deviceRecovered',
] as const;

export type NotificationCategory = (typeof NOTIFICATION_CATEGORIES)[number];
export const GENERAL_NOTIFICATION_CATEGORIES = ['info', 'warnung', 'alarm'] as const;
export type GeneralNotificationCategory = (typeof GENERAL_NOTIFICATION_CATEGORIES)[number];
export type OutputNotificationCategory = GeneralNotificationCategory;
export type NotificationLevelState = 'warning' | 'alarm' | 'timeout' | 'recovered' | 'invalid' | 'invalidValue';
export type RecoveryCause = 'limit' | 'timeout' | 'invalid';

/** Status information needed to distinguish timeout overlays from value problems. */
export interface NotificationStatusSnapshot {
	/** Effective status shown by the adapter, with timeout taking precedence. */
	status: WatchStatus;
	/** Status calculated without the timeout overlay. */
	underlyingStatus: WatchStatus;
	/** Whether the timeout overlay is currently active. */
	timedOut: boolean;
}

/** Notification transition generated from two snapshots. */
export interface NotificationTransition {
	/** Internal event category. */
	category: NotificationCategory;
	/** Cause used to choose a recovery template. */
	recoveryCause?: RecoveryCause;
}

const DEFAULT_OUTPUT_NOTIFICATION_CATEGORIES: Record<NotificationCategory, GeneralNotificationCategory> = {
	deviceWarning: 'warnung',
	deviceAlarm: 'alarm',
	deviceTimeout: 'alarm',
	invalidSource: 'warnung',
	invalidValue: 'warnung',
	deviceRecovered: 'info',
};

/**
 * Maps an adapter event to the general ioBroker notification category used for output.
 *
 * @param category Internal event category.
 * @returns General category used by notify and info.message.
 */
export function notificationCategoryForEvent(category: NotificationCategory): GeneralNotificationCategory {
	return DEFAULT_OUTPUT_NOTIFICATION_CATEGORIES[category];
}

/**
 * Maps an evaluated monitored status to the default output category used by summaries.
 * Unknown and normal states do not carry an alert severity.
 *
 * @param status Evaluated monitored status.
 */
export function notificationCategoryForStatus(status: WatchStatus): OutputNotificationCategory {
	switch (status) {
		case 'alarm':
		case 'timeout':
			return 'alarm';
		case 'warning':
		case 'invalid':
		case 'invalidValue':
			return 'warnung';
		default:
			return 'info';
	}
}

/**
 * Returns the highest category from a set of output categories.
 *
 * @param categories Categories to compare.
 */
export function highestNotificationCategory(
	categories: readonly OutputNotificationCategory[],
): OutputNotificationCategory {
	return categories.reduce<OutputNotificationCategory>(
		(highest, category) => (categoryPriority(category) > categoryPriority(highest) ? category : highest),
		'info',
	);
}

function categoryPriority(category: OutputNotificationCategory): number {
	switch (category) {
		case 'alarm':
			return 3;
		case 'warnung':
			return 2;
		case 'info':
			return 1;
	}
}

function problemCategoryForStatus(status: WatchStatus): NotificationCategory | undefined {
	switch (status) {
		case 'warning':
			return 'deviceWarning';
		case 'alarm':
			return 'deviceAlarm';
		case 'timeout':
			return 'deviceTimeout';
		case 'invalid':
			return 'invalidSource';
		case 'invalidValue':
			return 'invalidValue';
		default:
			return undefined;
	}
}

function recoveryCauseForStatus(status: WatchStatus): RecoveryCause | undefined {
	if (status === 'warning' || status === 'alarm') {
		return 'limit';
	}
	if (status === 'invalid' || status === 'invalidValue') {
		return 'invalid';
	}
	return undefined;
}

/**
 * Maps a status change to one or more notification events.
 *
 * A timeout overlays the underlying value status. When the source reports again,
 * the timeout recovery is emitted first and the current underlying problem is
 * emitted again so users can see both transitions in their actual order.
 *
 * @param previous Previous status snapshot.
 * @param current Current status snapshot.
 */
export function notificationTransitionsForSnapshots(
	previous: NotificationStatusSnapshot,
	current: NotificationStatusSnapshot,
): NotificationTransition[] {
	const transitions: NotificationTransition[] = [];
	const timeoutStarted = !previous.timedOut && current.timedOut;
	const timeoutEnded = previous.timedOut && !current.timedOut;

	if (timeoutStarted) {
		transitions.push({ category: 'deviceTimeout' });
		return transitions;
	}

	if (timeoutEnded) {
		transitions.push({ category: 'deviceRecovered', recoveryCause: 'timeout' });
		const currentProblem = problemCategoryForStatus(current.underlyingStatus);
		if (currentProblem && currentProblem !== 'deviceTimeout') {
			transitions.push({ category: currentProblem });
			return transitions;
		}
		const previousRecoveryCause = recoveryCauseForStatus(previous.underlyingStatus);
		if (previousRecoveryCause) {
			transitions.push({ category: 'deviceRecovered', recoveryCause: previousRecoveryCause });
		}
		return transitions;
	}

	if (current.timedOut) {
		return transitions;
	}

	if (previous.underlyingStatus === current.underlyingStatus && previous.status === current.status) {
		return transitions;
	}

	const currentProblem = problemCategoryForStatus(current.underlyingStatus);
	if (currentProblem) {
		if (
			recoveryCauseForStatus(previous.underlyingStatus) === 'invalid' &&
			(currentProblem === 'deviceWarning' || currentProblem === 'deviceAlarm')
		) {
			transitions.push({ category: 'deviceRecovered', recoveryCause: 'invalid' });
		}
		transitions.push({ category: currentProblem });
		return transitions;
	}

	const previousRecoveryCause = recoveryCauseForStatus(previous.underlyingStatus);
	if (previousRecoveryCause) {
		transitions.push({ category: 'deviceRecovered', recoveryCause: previousRecoveryCause });
	}
	return transitions;
}

/**
 * Maps a notification category to the corresponding configurable level state.
 *
 * @param category Notification category emitted by the adapter.
 * @returns The matching per-event level state ID.
 */
export function notificationLevelStateForCategory(category: NotificationCategory): NotificationLevelState {
	switch (category) {
		case 'deviceWarning':
			return 'warning';
		case 'deviceAlarm':
			return 'alarm';
		case 'deviceTimeout':
			return 'timeout';
		case 'deviceRecovered':
			return 'recovered';
		case 'invalidSource':
			return 'invalid';
		case 'invalidValue':
			return 'invalidValue';
	}
}

/**
 * Applies a per-event notification level while retaining the mapped output category as the default.
 * Unknown values fall back to the default so existing events continue to be delivered safely.
 *
 * @param level Configured level value.
 * @param defaultCategory Mapped output category used for standard or unknown levels.
 * @returns The selected output category, or undefined when the event is disabled.
 */
export function notificationCategoryForLevel(
	level: unknown,
	defaultCategory: OutputNotificationCategory,
): OutputNotificationCategory | undefined {
	switch (level) {
		case 1:
			return undefined;
		case 2:
			return 'info';
		case 3:
			return 'warnung';
		case 4:
			return 'alarm';
		default:
			return defaultCategory;
	}
}

/**
 * Maps a real status transition to its notification category.
 *
 * @param previous Status before the update.
 * @param current Status after the update.
 * @returns Category to emit, or undefined when the transition is not noteworthy.
 */
export function notificationCategoryForTransition(
	previous: WatchStatus,
	current: WatchStatus,
): NotificationCategory | undefined {
	if (previous === current) {
		return undefined;
	}
	if (current === 'warning') {
		return 'deviceWarning';
	}
	if (current === 'alarm') {
		return 'deviceAlarm';
	}
	if (current === 'timeout') {
		return 'deviceTimeout';
	}
	if (current === 'invalid') {
		return 'invalidSource';
	}
	if (current === 'invalidValue') {
		return 'invalidValue';
	}
	if (current === 'ok' && ['warning', 'alarm', 'timeout', 'invalid', 'invalidValue'].includes(previous)) {
		return 'deviceRecovered';
	}
	return undefined;
}
