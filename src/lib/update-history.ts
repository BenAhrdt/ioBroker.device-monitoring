export const UPDATE_HISTORY_SIZE = 10;
export const SAME_VALUE_DUPLICATE_WINDOW = 1_000;

/** Source update metadata used to identify a rapid same-value duplicate. */
export interface SourceUpdateMetadata {
	/** Source value. */
	value: ioBroker.StateValue;
	/** Source acknowledgement flag. */
	ack: boolean;
	/** Source timestamp in milliseconds. */
	timestamp: number;
	/** Source last-change timestamp in milliseconds, when provided by ioBroker. */
	lastChangedTimestamp?: number;
}

/** Persisted source metadata used when the in-memory preceding event is unavailable. */
export interface PersistedUpdateMetadata {
	/** Previously monitored value. */
	value: ioBroker.StateValue | undefined;
	/** Previously persisted source timestamp. */
	timestamp: number | undefined;
}

/**
 * Determines whether a source event repeats the same value too quickly to be
 * a separate measurement. This covers both acknowledgement pairs and source
 * adapters that write the same value with the same acknowledgement flag.
 *
 * @param previous Previous source event or persisted monitoring data.
 * @param current Current source event.
 */
export function isSameValueDuplicate(
	previous: { value: ioBroker.StateValue | undefined; timestamp: number | undefined } | undefined,
	current: SourceUpdateMetadata,
): boolean {
	if (
		!previous ||
		previous.value === undefined ||
		!Object.is(previous.value, current.value) ||
		typeof previous.timestamp !== 'number' ||
		!Number.isFinite(previous.timestamp)
	) {
		return false;
	}
	const elapsed = current.timestamp - previous.timestamp;
	return elapsed >= 0 && elapsed < SAME_VALUE_DUPLICATE_WINDOW;
}

/** A numeric value and the source timestamp at which it was observed. */
export interface NumericValueSample {
	/** Source timestamp in milliseconds. */
	timestamp: number;
	/** Numeric source value. */
	value: number;
}

/**
 * Determines whether a second source event is only the acknowledgement of the
 * preceding event and must not become a separate update.
 *
 * @param previous Previous source event for the monitored state.
 * @param current Current source event.
 */
export function isAcknowledgementDuplicate(
	previous: SourceUpdateMetadata | undefined,
	current: SourceUpdateMetadata,
): boolean {
	if (!previous || previous.ack === current.ack) {
		return false;
	}
	const sameLastChangedTimestamp =
		typeof previous.lastChangedTimestamp === 'number' &&
		Number.isFinite(previous.lastChangedTimestamp) &&
		typeof current.lastChangedTimestamp === 'number' &&
		Number.isFinite(current.lastChangedTimestamp) &&
		previous.lastChangedTimestamp === current.lastChangedTimestamp;
	return sameLastChangedTimestamp || isSameValueDuplicate(previous, current);
}

/**
 * Determines whether a rapid same-value source event is a duplicate based on persisted data.
 * This also covers cases where the in-memory source cache was overwritten by an intermediary
 * event or where the source uses the same acknowledgement flag for both writes.
 *
 * @param previous Previously persisted monitoring data.
 * @param current Current source event.
 */
export function isPersistedSameValueDuplicate(
	previous: PersistedUpdateMetadata | undefined,
	current: SourceUpdateMetadata,
): boolean {
	return isSameValueDuplicate(previous, current);
}

/**
 * Formats a duration while omitting trailing zero-value units.
 *
 * @param milliseconds Duration to format.
 */
export function intervalDisplay(milliseconds: number): string {
	if (milliseconds > 0 && milliseconds < 1_000) {
		return '<1s';
	}
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
