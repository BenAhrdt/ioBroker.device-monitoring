import { expect } from 'chai';
import { describe, it } from 'mocha';
import {
	createFunctionTemplate,
	evaluateLimit,
	getWatchStatus,
	isUpdateTimedOut,
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
	it('supports lower and upper limits', () => {
		expect(evaluateLimit(9, limit('below', 10))).to.equal(true);
		expect(evaluateLimit(11, limit('above', undefined, 10))).to.equal(true);
	});
	it('supports allowed and forbidden ranges', () => {
		expect(evaluateLimit(15, limit('outside', 10, 20))).to.equal(false);
		expect(evaluateLimit(25, limit('outside', 10, 20))).to.equal(true);
		expect(evaluateLimit(15, limit('inside', 10, 20))).to.equal(true);
	});
	it('gives alarms priority and reports missing values', () => {
		expect(getWatchStatus(90, limit('above', undefined, 70), limit('above', undefined, 80))).to.equal('alarm');
		expect(getWatchStatus(null, limit('below', 5), limit('above', undefined, 80))).to.equal('unknown');
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

	it('stores activation and modes but no individual limits or timeout duration', () => {
		const configured = state('state', 'temperature', 20);
		configured.staleWarning = { enabled: true, minutes: 45 };
		const template = createFunctionTemplate(configured);

		expect(template).to.deep.equal({
			warning: { enabled: true, mode: 'above' },
			alarm: { enabled: true, mode: 'above' },
			staleWarning: { enabled: true },
		});
		expect(template).not.to.have.nested.property('warning.max');
		expect(template).not.to.have.nested.property('staleWarning.minutes');
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
