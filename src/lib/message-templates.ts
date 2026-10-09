/** Language used for user-facing message fragments. */
export type MessageLanguage = 'de' | 'en' | 'ru' | 'pt' | 'nl' | 'fr' | 'it' | 'es' | 'pl' | 'uk' | 'zh-cn';

const RESPONSE_TIME_LABELS: Record<
	MessageLanguage,
	{ label: string; minute: string; minutes: string; second: string; seconds: string }
> = {
	en: { label: 'Response time', minute: 'minute', minutes: 'minutes', second: 'second', seconds: 'seconds' },
	de: { label: 'Ansprechzeit', minute: 'Minute', minutes: 'Minuten', second: 'Sekunde', seconds: 'Sekunden' },
	ru: { label: 'Время отклика', minute: 'минута', minutes: 'минут', second: 'секунда', seconds: 'секунд' },
	pt: { label: 'Tempo de resposta', minute: 'minuto', minutes: 'minutos', second: 'segundo', seconds: 'segundos' },
	nl: { label: 'Responstijd', minute: 'minuut', minutes: 'minuten', second: 'seconde', seconds: 'seconden' },
	fr: { label: 'Temps de réponse', minute: 'minute', minutes: 'minutes', second: 'seconde', seconds: 'secondes' },
	it: { label: 'Tempo di risposta', minute: 'minuto', minutes: 'minuti', second: 'secondo', seconds: 'secondi' },
	es: { label: 'Tiempo de respuesta', minute: 'minuto', minutes: 'minutos', second: 'segundo', seconds: 'segundos' },
	pl: { label: 'Czas odpowiedzi', minute: 'minuta', minutes: 'minut', second: 'sekunda', seconds: 'sekund' },
	uk: { label: 'Час відповіді', minute: 'хвилина', minutes: 'хвилин', second: 'секунда', seconds: 'секунд' },
	'zh-cn': { label: '响应时间', minute: '分钟', minutes: '分钟', second: '秒', seconds: '秒' },
};

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
	const labels = RESPONSE_TIME_LABELS[language];
	return ` (${labels.label} ${minutes} ${minutes === 1 ? labels.minute : labels.minutes})`;
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
	const labels = RESPONSE_TIME_LABELS[language];
	const unit = seconds === 1 ? labels.second : labels.seconds;
	return ` (${labels.label} ${seconds} ${unit})`;
}
