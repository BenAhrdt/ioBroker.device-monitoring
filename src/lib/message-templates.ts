/** Language used for user-facing message fragments. */
export type MessageLanguage = 'de' | 'en';

/**
 * Formats the optional response-time suffix used by warning and alarm templates.
 *
 * @param minutes Configured response time in minutes.
 * @param language Language for the generated fragment.
 * @returns A suffix including its leading space, or an empty string.
 */
export function formatResponseTimeSuffix(minutes: number | undefined, language: MessageLanguage): string {
	if (typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes <= 0) {
		return '';
	}
	return language === 'de' ? ` (Ansprechzeit ${minutes} Minuten)` : ` (Response time ${minutes} minutes)`;
}

/**
 * Formats the optional response-time suffix used for invalid sources and values.
 *
 * @param seconds Configured response time in seconds.
 * @param language Language for the generated fragment.
 * @returns A suffix including its leading space, or an empty string.
 */
export function formatInvalidResponseTimeSuffix(seconds: number | undefined, language: MessageLanguage): string {
	if (typeof seconds !== 'number' || !Number.isFinite(seconds) || seconds <= 0) {
		return '';
	}
	const unit =
		seconds === 1 ? (language === 'de' ? 'Sekunde' : 'second') : language === 'de' ? 'Sekunden' : 'seconds';
	return language === 'de' ? ` (Ansprechzeit ${seconds} ${unit})` : ` (Response time ${seconds} ${unit})`;
}
