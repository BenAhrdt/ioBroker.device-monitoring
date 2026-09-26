import type { WatchStatus } from './evaluation';
import {
	highestNotificationCategory,
	notificationCategoryForStatus,
	type OutputNotificationCategory,
} from './notifications';

/** One monitored state included in a recurring summary. */
export interface SummaryReminderItem {
	/** Display name of the monitored device. */
	deviceName: string;
	/** Display name of the monitored state. */
	stateName: string;
	/** Current evaluated state. */
	status: WatchStatus;
	/** Configured source state ID. */
	sourceId: string;
	/** Current source value. */
	value: ioBroker.StateValue;
	/** Unit copied from the source object. */
	unit: string;
	/** Timestamp of the last source update, if available. */
	lastUpdate: number | null;
}

/** The rendered title and body of a summary reminder. */
export interface SummaryReminderMessage {
	/** Summary notification title. */
	title: string;
	/** Summary notification body. */
	message: string;
}

/** One notification captured during a notification collection period. */
export interface NotificationSummaryItem {
	/** Display name of the monitored device. */
	deviceName: string;
	/** Display name of the monitored state. */
	stateName: string;
	/** Effective output category of the captured event. */
	category: OutputNotificationCategory;
	/** Rendered notification title. */
	title: string;
	/** Rendered notification message. */
	message: string;
	/** Timestamp when the event was created. */
	triggeredAt: number;
}

/**
 * Formats a source timestamp for the summary text.
 *
 * @param timestamp Source timestamp, or null when unavailable.
 * @returns Local date/time without milliseconds.
 */
function timestampDisplay(timestamp: number | null): string {
	if (timestamp === null) {
		return '—';
	}
	const date = new Date(timestamp);
	const pad = (value: number, length = 2): string => String(value).padStart(length, '0');
	const formatted = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
	return formatted;
}

function statusLabel(status: WatchStatus, language: 'de' | 'en'): string {
	if (language === 'de') {
		switch (status) {
			case 'warning':
				return 'Warnung';
			case 'alarm':
				return 'Alarm';
			case 'timeout':
				return 'Timeout';
			case 'invalid':
				return 'Ungültige Quelle';
			case 'invalidValue':
				return 'Ungültiger Wert';
			default:
				return 'Nicht normal';
		}
	}
	switch (status) {
		case 'warning':
			return 'Warning';
		case 'alarm':
			return 'Alarm';
		case 'timeout':
			return 'Timeout';
		case 'invalid':
			return 'Invalid source';
		case 'invalidValue':
			return 'Invalid value';
		default:
			return 'Not normal';
	}
}

function valueDisplay(value: ioBroker.StateValue, unit: string): string {
	if (value === null || value === undefined) {
		return '—';
	}
	return `${String(value)}${unit ? ` ${unit}` : ''}`;
}

/**
 * Builds the user-facing text for a reminder containing all currently active states.
 *
 * @param items Currently non-normal monitored states.
 * @param language Adapter display language.
 * @returns Summary title and message, or undefined when all monitored states are normal.
 */
export function createSummaryReminderMessage(
	items: readonly SummaryReminderItem[],
	language: 'de' | 'en',
): SummaryReminderMessage | undefined {
	if (!items.length) {
		return undefined;
	}

	const title = language === 'de' ? 'Erinnerung: Aktive Gerätezustände' : 'Reminder: Active device states';
	const heading =
		language === 'de'
			? 'Folgende überwachte Zustände sind aktuell nicht normal:'
			: 'The following monitored states are currently not normal:';
	const lines = items.map(item => {
		let detail = `${statusLabel(item.status, language)}: ${valueDisplay(item.value, item.unit)}`;
		if (item.status === 'timeout') {
			detail = `${statusLabel(item.status, language)} (${language === 'de' ? 'letzte Aktualisierung' : 'last update'}: ${timestampDisplay(item.lastUpdate)})`;
		} else if (item.status === 'invalid') {
			detail = `${statusLabel(item.status, language)}: ${item.sourceId}`;
		}
		return `- ${item.deviceName} / ${item.stateName}: ${detail}`;
	});
	return { title, message: `${heading}\n${lines.join('\n')}` };
}

/**
 * Determines the category for a current-state summary from its highest status.
 *
 * @param items Current non-normal monitored states.
 */
export function summaryCategoryForItems(items: readonly SummaryReminderItem[]): OutputNotificationCategory {
	return highestNotificationCategory(items.map(item => notificationCategoryForStatus(item.status)));
}

function categoryLabel(category: OutputNotificationCategory, language: 'de' | 'en'): string {
	if (language === 'de') {
		switch (category) {
			case 'alarm':
				return 'Alarm';
			case 'warnung':
				return 'Warnung';
			case 'info':
				return 'Info';
		}
	}
	switch (category) {
		case 'alarm':
			return 'Alarm';
		case 'warnung':
			return 'Warning';
		case 'info':
			return 'Info';
	}
}

/**
 * Builds a summary of all notifications captured during a collection period.
 *
 * @param items Captured notification events.
 * @param language Adapter display language.
 * @param startedAt Start timestamp of the collection period.
 * @param endedAt End timestamp of the collection period.
 */
export function createNotificationCollectionSummaryMessage(
	items: readonly NotificationSummaryItem[],
	language: 'de' | 'en',
	startedAt: number,
	endedAt: number,
): SummaryReminderMessage | undefined {
	if (!items.length) {
		return undefined;
	}

	const title = language === 'de' ? 'Sammelbericht: Benachrichtigungen' : 'Collected notification summary';
	const heading =
		language === 'de'
			? `Im Zeitraum ${timestampDisplay(startedAt)} bis ${timestampDisplay(endedAt)} traten folgende Ereignisse auf:`
			: `The following events occurred between ${timestampDisplay(startedAt)} and ${timestampDisplay(endedAt)}:`;
	const lines = items.map(item => {
		const message = item.message.replace(/\s*\n\s*/g, ' ').trim();
		return `- [${categoryLabel(item.category, language)}] ${timestampDisplay(item.triggeredAt)} ${item.deviceName} / ${item.stateName}: ${message}`;
	});
	return { title, message: `${heading}\n${lines.join('\n')}` };
}
