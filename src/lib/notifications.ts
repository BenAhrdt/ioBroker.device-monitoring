import type { WatchStatus } from './evaluation';

export const NOTIFICATION_CATEGORIES = [
	'deviceWarning',
	'deviceAlarm',
	'deviceTimeout',
	'invalidSource',
	'deviceRecovered',
] as const;

export type NotificationCategory = (typeof NOTIFICATION_CATEGORIES)[number];
export const GENERAL_NOTIFICATION_CATEGORIES = ['info', 'warnung', 'alarm'] as const;
export type GeneralNotificationCategory = (typeof GENERAL_NOTIFICATION_CATEGORIES)[number];
export type OutputNotificationCategory = NotificationCategory | GeneralNotificationCategory;
export type NotificationLevelState = 'warning' | 'alarm' | 'timeout' | 'recovered' | 'invalid';

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
	}
}

/**
 * Applies a per-event notification level while retaining the original category as the default.
 * Unknown values fall back to the default so existing events continue to be delivered safely.
 *
 * @param level Configured level value.
 * @param defaultCategory Original notification category used for standard or unknown levels.
 * @returns The selected output category, or undefined when the event is disabled.
 */
export function notificationCategoryForLevel(
	level: unknown,
	defaultCategory: NotificationCategory,
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
	if (current === 'ok' && ['warning', 'alarm', 'timeout', 'invalid'].includes(previous)) {
		return 'deviceRecovered';
	}
	return undefined;
}
