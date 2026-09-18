export const UPDATE_HISTORY_SIZE = 10;

/**
 * Formats a duration while omitting trailing zero-value units.
 *
 * @param milliseconds Duration to format.
 */
export function intervalDisplay(milliseconds: number): string {
	const seconds = Math.max(0, Math.round(milliseconds / 1000));
	const days = Math.floor(seconds / 86_400);
	const hours = Math.floor((seconds % 86_400) / 3_600);
	const minutes = Math.floor((seconds % 3_600) / 60);
	const restSeconds = seconds % 60;
	return [
		days && `${days}d`,
		hours && `${hours}h`,
		minutes && `${minutes}m`,
		(!days && !hours && !minutes) || restSeconds ? `${restSeconds}s` : '',
	]
		.filter(Boolean)
		.join(' ');
}

/**
 * Reads, validates, sorts and limits a persisted timestamp history.
 *
 * @param value Persisted JSON value.
 */
export function parseUpdateHistory(value: unknown): number[] {
	try {
		const parsed = typeof value === 'string' ? JSON.parse(value) : value;
		if (!Array.isArray(parsed)) {
			return [];
		}
		return parsed
			.filter(timestamp => typeof timestamp === 'number' && Number.isFinite(timestamp) && timestamp > 0)
			.sort((a, b) => a - b)
			.filter((timestamp, index, timestamps) => index === 0 || timestamp !== timestamps[index - 1])
			.slice(-UPDATE_HISTORY_SIZE);
	} catch {
		return [];
	}
}

/**
 * Calculates the mean of all consecutive intervals represented by the timestamps.
 *
 * @param timestamps Sorted timestamps used for the calculation.
 */
export function averageInterval(timestamps: number[]): number | null {
	if (timestamps.length < 2) {
		return null;
	}
	return (timestamps[timestamps.length - 1] - timestamps[0]) / (timestamps.length - 1);
}
