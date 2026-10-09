import { expect } from 'chai';
import { describe, it } from 'mocha';
import {
	createFunctionTemplate,
	evaluateLimit,
	getWatchStatus,
	isUpdateTimedOut,
	parseAbsoluteChange,
	parseFiniteNumber,
	parsePercentage,
	type LimitConfiguration,
	type WatchedStateConfiguration,
} from './lib/evaluation';

const limit = (mode: LimitConfiguration['mode'], min?: number, max?: number): LimitConfiguration => ({
	enabled: true,
	mode,
	min,
	max,
});

describe('threshold evaluation', () => {
	it('parses decimal limits with either locale separator', () => {
		expect(parseFiniteNumber('9.5')).to.equal(9.5);
		expect(parseFiniteNumber('9,5')).to.equal(9.5);
		expect(parseFiniteNumber('9,5,1')).to.equal(undefined);
	});
	it('parses non-negative percentages without an upper bound', () => {
		expect(parsePercentage('20,5')).to.equal(20.5);
		expect(parsePercentage(0)).to.equal(0);
		expect(parsePercentage(100)).to.equal(100);
		expect(parsePercentage(-1)).to.equal(undefined);
		expect(parsePercentage(101)).to.equal(101);
		expect(parsePercentage(250)).to.equal(250);
	});
	it('parses non-negative absolute changes', () => {
		expect(parseAbsoluteChange('10,5')).to.equal(10.5);
		expect(parseAbsoluteChange(0)).to.equal(0);
		expect(parseAbsoluteChange(-1)).to.equal(undefined);
	});

	it('supports lower and upper limits', () => {
		expect(evaluateLimit(9, limit('below', 10))).to.equal(true);
		expect(evaluateLimit(11, limit('above', undefined, 10))).to.equal(true);
	});
	it('supports allowed and forbidden ranges', () => {
		expect(evaluateLimit(15, limit('outside', 10, 20))).to.equal(false);
		expect(evaluateLimit(25, limit('outside', 10, 20))).to.equal(true);
		expect(evaluateLimit(15, limit('inside', 10, 20))).to.equal(true);
	});
	it('supports decimal limits and boolean trigger values', () => {
		expect(evaluateLimit(10.5, limit('above', undefined, 10.25))).to.equal(true);
		expect(evaluateLimit(true, { enabled: true, mode: 'outside', booleanValue: true })).to.equal(true);
		expect(evaluateLimit(false, { enabled: true, mode: 'outside', booleanValue: true })).to.equal(false);
		expect(
			getWatchStatus(
				false,
				{ enabled: true, mode: 'outside', booleanValue: false },
				{ enabled: false, mode: 'outside' },
			),
		).to.equal('warning');
	});
	it('gives alarms priority and reports missing values', () => {
		expect(getWatchStatus(90, limit('above', undefined, 70), limit('above', undefined, 80))).to.equal('alarm');
		expect(getWatchStatus(null, limit('below', 5), limit('above', undefined, 80))).to.equal('invalidValue');
		expect(getWatchStatus('unavailable', limit('below', 5), limit('above', undefined, 80))).to.equal(
			'invalidValue',
		);
	});
	it('waits for the configured response time before activating a limit', () => {
		const now = 1_000_000;
		const warning = { ...limit('below', 40), responseDelayMinutes: 41 };
		const activation = { warningSince: now - 40 * 60_000, alarmSince: null };

		const alarm = { enabled: false, mode: 'below' as const };
		expect(getWatchStatus(0, warning, alarm, false, activation, now)).to.equal('ok');
		expect(
			getWatchStatus(
				0,
				warning,
				alarm,
				false,
				{
					...activation,
					warningSince: now - 41 * 60_000,
				},
				now,
			),
		).to.equal('warning');
	});
	it('evaluates positive and negative percentage changes against the previous value', () => {
		const positive: LimitConfiguration = {
			enabled: true,
			mode: 'percentage',
			positiveChangeEnabled: true,
			positiveChangePercent: 20,
		};
		const negative: LimitConfiguration = {
			enabled: true,
			mode: 'percentage',
			negativeChangeEnabled: true,
			negativeChangePercent: 20,
		};

		expect(evaluateLimit(60, positive, 50)).to.equal(true);
		expect(evaluateLimit(55, positive, 50)).to.equal(false);
		expect(evaluateLimit(40, negative, 50)).to.equal(true);
		expect(evaluateLimit(45, negative, 50)).to.equal(false);
		expect(evaluateLimit(10, positive, 0)).to.equal(false);
	});
	it('evaluates positive and negative absolute changes against the previous value', () => {
		const positive: LimitConfiguration = {
			enabled: true,
			mode: 'absolute',
			positiveChangeEnabled: true,
			positiveChangeValue: 10,
		};
		const negative: LimitConfiguration = {
			enabled: true,
			mode: 'absolute',
			negativeChangeEnabled: true,
			negativeChangeValue: 10,
		};

		expect(evaluateLimit(60, positive, 50)).to.equal(true);
		expect(evaluateLimit(59, positive, 50)).to.equal(false);
		expect(evaluateLimit(40, negative, 50)).to.equal(true);
		expect(evaluateLimit(41, negative, 50)).to.equal(false);
		expect(evaluateLimit(10, positive, 0)).to.equal(true);
	});
	it('uses the persisted percentage violation for status and response time', () => {
		const now = 1_000_000;
		const warning: LimitConfiguration = {
			enabled: true,
			mode: 'percentage',
			positiveChangeEnabled: true,
			positiveChangePercent: 20,
			responseDelayMinutes: 10,
		};
		const alarm: LimitConfiguration = { enabled: false, mode: 'percentage' };

		expect(getWatchStatus(60, warning, alarm, false)).to.equal('ok');
		expect(
			getWatchStatus(
				60,
				warning,
				alarm,
				false,
				{ warningSince: now - 10 * 60_000, alarmSince: null, warningPercentageViolation: true },
				now,
			),
		).to.equal('warning');
	});
});

describe('function template', () => {
	const state = (id: string, functionName: string, warningAt: number): WatchedStateConfiguration => ({
		id,
		name: id,
		sourceId: `source.${id}`,
		function: functionName,
		warning: limit('above', undefined, warningAt),
		alarm: limit('above', undefined, warningAt + 10),
		staleWarning: { enabled: false, minutes: 60 },
	});

	it('stores the complete monitoring configuration', () => {
		const configured = state('state', 'temperature', 20);
		configured.warning.responseDelayMinutes = 41;
		configured.staleWarning = { enabled: true, minutes: 45 };
		const template = createFunctionTemplate(configured);

		expect(template).to.deep.equal({
			warning: { enabled: true, mode: 'above', min: undefined, max: 20, responseDelayMinutes: 41 },
			alarm: { enabled: true, mode: 'above', min: undefined, max: 30 },
			staleWarning: { enabled: true, minutes: 45 },
		});
	});
});

describe('update timeout', () => {
	it('uses the state update timestamp and the configured minutes', () => {
		const now = 1_000_000;
		const state = { val: 10, ack: true, ts: now - 5 * 60_000, lc: now - 20 * 60_000, from: 'test' };

		expect(isUpdateTimedOut(state, { enabled: true, minutes: 4 }, now)).to.equal(true);
		expect(isUpdateTimedOut(state, { enabled: true, minutes: 6 }, now)).to.equal(false);
		expect(isUpdateTimedOut(state, { enabled: false, minutes: 4 }, now)).to.equal(false);
	});

	it('reports an update timeout with priority over numeric alarms', () => {
		expect(getWatchStatus(50, limit('above', undefined, 70), limit('above', undefined, 80), true)).to.equal(
			'timeout',
		);
		expect(getWatchStatus(90, limit('above', undefined, 70), limit('above', undefined, 80), true)).to.equal(
			'timeout',
		);
		expect(getWatchStatus(null, limit('above', undefined, 70), limit('above', undefined, 80), true)).to.equal(
			'timeout',
		);
	});
});
