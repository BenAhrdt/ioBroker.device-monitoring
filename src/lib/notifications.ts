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
