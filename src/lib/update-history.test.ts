import { expect } from 'chai';
import { describe, it } from 'mocha';
import {
	averageInterval,
	isAcknowledgementDuplicate,
	isPersistedSameValueDuplicate,
	intervalDisplay,
	parseUpdateHistory,
	parseValueHistory,
	timeWeightedAverage,
	UPDATE_HISTORY_SIZE,
} from './update-history';

describe('update history', () => {
	it('ignores a same-value acknowledgement event only within one second', () => {
		const previous = { value: 15, ack: false, timestamp: 10_000 };

		expect(isAcknowledgementDuplicate(previous, { value: 15, ack: true, timestamp: 10_999 })).to.equal(true);
		expect(
			isAcknowledgementDuplicate(
				{ value: 15, ack: false, timestamp: 20_000, lastChangedTimestamp: 15_000 },
				{ value: 15.0001, ack: true, timestamp: 20_500, lastChangedTimestamp: 15_000 },
			),
		).to.equal(true);
		expect(isAcknowledgementDuplicate(previous, { value: 15, ack: true, timestamp: 11_000 })).to.equal(false);
		expect(isAcknowledgementDuplicate(previous, { value: 16, ack: true, timestamp: 10_500 })).to.equal(false);
		expect(isAcknowledgementDuplicate(previous, { value: 15, ack: false, timestamp: 10_500 })).to.equal(false);
	});

	it('uses persisted monitoring data for rapid same-value source events', () => {
		expect(
			isPersistedSameValueDuplicate(
				{ value: 15, timestamp: 10_000 },
				{ value: 15, ack: true, timestamp: 10_999 },
			),
		).to.equal(true);
		expect(
			isPersistedSameValueDuplicate(
				{ value: 15, timestamp: 10_000 },
				{ value: 15, ack: true, timestamp: 11_000 },
			),
		).to.equal(false);
		expect(
			isPersistedSameValueDuplicate(
				{ value: 15, timestamp: 10_000 },
				{ value: 15, ack: false, timestamp: 10_999 },
			),
		).to.equal(true);
	});

	it('omits empty trailing interval units', () => {
		expect(intervalDisplay(10 * 60_000)).to.equal('10m');
		expect(intervalDisplay(2 * 3_600_000)).to.equal('2h');
		expect(intervalDisplay(86_400_000)).to.equal('1d');
		expect(intervalDisplay(3_661_000)).to.equal('1h 1m 1s');
		expect(intervalDisplay(400)).to.equal('<1s');
	});

	it('keeps the ten newest valid unique timestamps', () => {
		const timestamps = [12, 4, 4, 0, 'invalid', ...Array.from({ length: 11 }, (_, index) => index + 1)];
		expect(parseUpdateHistory(JSON.stringify(timestamps))).to.deep.equal(
			Array.from({ length: UPDATE_HISTORY_SIZE }, (_, index) => index + 3),
		);
	});

	it('accepts an already parsed timestamp array', () => {
		expect(parseUpdateHistory([3, 1, 2])).to.deep.equal([1, 2, 3]);
	});

	it('calculates the average of the represented intervals', () => {
		expect(averageInterval([1_000, 2_000, 5_000])).to.equal(2_000);
		expect(averageInterval([1_000])).to.equal(null);
	});

	it('keeps the ten newest valid timestamped numeric values', () => {
		const samples = [
			{ timestamp: 12, value: 12 },
			{ timestamp: 4, value: 4 },
			{ timestamp: 4, value: 40 },
			{ timestamp: 0, value: 0 },
			{ timestamp: 13, value: Number.NaN },
			...Array.from({ length: 11 }, (_, index) => ({ timestamp: index + 1, value: index + 1 })),
		];
		expect(parseValueHistory(JSON.stringify(samples))).to.deep.equal(
			Array.from({ length: UPDATE_HISTORY_SIZE }, (_, index) => ({ timestamp: index + 3, value: index + 3 })),
		);
	});

	it('calculates a time-weighted average from irregularly spaced measurements', () => {
		expect(
			timeWeightedAverage([
				{ timestamp: 1_000, value: 10 },
				{ timestamp: 2_000, value: 20 },
				{ timestamp: 11_000, value: 20 },
			]),
		).to.equal(19.5);
		expect(timeWeightedAverage([{ timestamp: 1_000, value: 10 }])).to.equal(null);
	});

	it('skips sample gaps longer than the configured timeout', () => {
		expect(
			timeWeightedAverage(
				[
					{ timestamp: 1_000, value: 10 },
					{ timestamp: 101_000, value: 100 },
					{ timestamp: 111_000, value: 20 },
				],
				20_000,
			),
		).to.equal(60);
		expect(
			timeWeightedAverage(
				[
					{ timestamp: 1_000, value: 10 },
					{ timestamp: 101_000, value: 100 },
				],
				20_000,
			),
		).to.equal(null);
	});
});
