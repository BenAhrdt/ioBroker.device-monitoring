import type { WatchStatus } from './evaluation';

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
