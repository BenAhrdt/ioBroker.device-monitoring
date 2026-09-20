export const UPDATE_HISTORY_SIZE = 10;

/** A numeric value and the source timestamp at which it was observed. */
export interface NumericValueSample {
	/** Source timestamp in milliseconds. */
	timestamp: number;
	/** Numeric source value. */
	value: number;
}

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
 * Reads, validates, sorts and limits a persisted numeric value history.
 *
 * @param value Persisted JSON value.
 */
export function parseValueHistory(value: unknown): NumericValueSample[] {
	try {
		const parsed = typeof value === 'string' ? JSON.parse(value) : value;
		if (!Array.isArray(parsed)) {
			return [];
		}
		const byTimestamp = new Map<number, NumericValueSample>();
		for (const entry of parsed) {
			if (
				typeof entry === 'object' &&
				entry !== null &&
				typeof entry.timestamp === 'number' &&
				Number.isFinite(entry.timestamp) &&
				entry.timestamp > 0 &&
				typeof entry.value === 'number' &&
				Number.isFinite(entry.value)
			) {
				byTimestamp.set(entry.timestamp, { timestamp: entry.timestamp, value: entry.value });
			}
		}
		return [...byTimestamp.values()].sort((a, b) => a.timestamp - b.timestamp).slice(-UPDATE_HISTORY_SIZE);
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

/**
 * Calculates a time-weighted average by linearly interpolating between numeric samples.
 * Gaps longer than maxGapMilliseconds are skipped because their values are stale or missing.
 *
 * @param samples Ordered timestamped numeric samples.
 * @param maxGapMilliseconds Optional maximum sample gap to include.
 */
export function timeWeightedAverage(samples: NumericValueSample[], maxGapMilliseconds?: number): number | null {
	if (samples.length < 2) {
		return null;
	}
	let weightedSum = 0;
	let totalDuration = 0;
	for (let index = 1; index < samples.length; index++) {
		const previous = samples[index - 1];
		const current = samples[index];
		const duration = current.timestamp - previous.timestamp;
		if (duration <= 0 || (maxGapMilliseconds !== undefined && duration > maxGapMilliseconds)) {
			continue;
		}
		weightedSum += ((previous.value + current.value) / 2) * duration;
		totalDuration += duration;
	}
	return totalDuration > 0 ? weightedSum / totalDuration : null;
}
