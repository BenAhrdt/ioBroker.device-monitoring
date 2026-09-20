import type { WatchStatus } from './evaluation';
import type { NumericValueSample } from './update-history';

/** Runtime snapshot stored for one monitored source. */
export interface MonitoringData {
	/** Configured source state ID. */
	sourceId: string;
	/** Current source value. */
	value: ioBroker.StateValue;
	/** Unit copied from the source object. */
	unit: string;
	/** Current evaluated monitoring status. */
	status: WatchStatus;
	/** Whether the warning status is active. */
	warning: boolean;
	/** Whether the alarm status is active. */
	alarm: boolean;
	/** Whether the configured update timeout is active. */
	updateTimeout: boolean;
	/** Most recent source timestamp. */
	lastUpdate: number | null;
	/** Source timestamp preceding the most recent one. */
	previousUpdate: number | null;
	/** Interval between the two most recent updates. */
	updateInterval: number | null;
	/** Average interval represented by the timestamp history. */
	averageUpdateInterval: number | null;
	/** Up to ten most recent unique source timestamps. */
	updateHistory: number[];
	/** Average numeric value over the known measurement intervals. */
	averageValue: number | null;
	/** Up to ten most recent timestamped numeric values. */
	valueHistory: NumericValueSample[];
}
