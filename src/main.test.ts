import { expect } from 'chai';
import { describe, it } from 'mocha';
import {
	evaluateLimit,
	getFunctionProfiles,
	getWatchStatus,
	isUpdateTimedOut,
	type DeviceConfiguration,
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

describe('function templates', () => {
	const state = (id: string, functionName: string, warningAt: number): WatchedStateConfiguration => ({
		id,
		name: id,
		sourceId: `source.${id}`,
		function: functionName,
		warning: limit('above', undefined, warningAt),
		alarm: limit('above', undefined, warningAt + 10),
		staleWarning: { enabled: false, minutes: 60 },
	});

	it('uses the last configured state when a function occurs more than once', () => {
		const first = state('first', 'temperature', 20);
		const latest = state('latest', 'temperature', 30);
		const devices: DeviceConfiguration[] = [{ id: 'device', name: 'Device', states: [first, latest] }];

		expect(getFunctionProfiles(devices).temperature.warning.max).to.equal(30);
	});

	it('prefers the edited state without changing other function templates', () => {
		const edited = state('edited', 'temperature', 20);
		const latest = state('latest', 'temperature', 30);
		const humidity = state('humidity', 'humidity', 60);
		const devices: DeviceConfiguration[] = [{ id: 'device', name: 'Device', states: [edited, latest, humidity] }];

		const profiles = getFunctionProfiles(devices, edited);
		expect(profiles.temperature.warning.max).to.equal(20);
		expect(profiles.humidity.warning.max).to.equal(60);
	});

	it('returns detached limits so form changes cannot mutate the configuration', () => {
		const configured = state('state', 'temperature', 20);
		const devices: DeviceConfiguration[] = [{ id: 'device', name: 'Device', states: [configured] }];
		const profiles = getFunctionProfiles(devices);

		profiles.temperature.warning.max = 99;
		expect(configured.warning.max).to.equal(20);
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
