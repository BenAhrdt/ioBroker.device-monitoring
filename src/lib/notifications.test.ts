import { expect } from 'chai';
import { describe, it } from 'mocha';
import {
	notificationCategoryForLevel,
	notificationCategoryForTransition,
	notificationLevelStateForCategory,
} from './notifications';

describe('notification transitions', () => {
	it('maps problem states to their categories', () => {
		expect(notificationCategoryForTransition('ok', 'warning')).to.equal('deviceWarning');
		expect(notificationCategoryForTransition('warning', 'alarm')).to.equal('deviceAlarm');
		expect(notificationCategoryForTransition('ok', 'timeout')).to.equal('deviceTimeout');
		expect(notificationCategoryForTransition('ok', 'invalid')).to.equal('invalidSource');
	});

	it('reports recovery only after a notified problem state', () => {
		expect(notificationCategoryForTransition('alarm', 'ok')).to.equal('deviceRecovered');
		expect(notificationCategoryForTransition('unknown', 'ok')).to.equal(undefined);
	});

	it('does not emit notifications for unchanged states', () => {
		expect(notificationCategoryForTransition('alarm', 'alarm')).to.equal(undefined);
	});

	it('maps each existing category to its per-event level state', () => {
		expect(notificationLevelStateForCategory('deviceWarning')).to.equal('warning');
		expect(notificationLevelStateForCategory('deviceAlarm')).to.equal('alarm');
		expect(notificationLevelStateForCategory('deviceTimeout')).to.equal('timeout');
		expect(notificationLevelStateForCategory('deviceRecovered')).to.equal('recovered');
		expect(notificationLevelStateForCategory('invalidSource')).to.equal('invalid');
	});

	it('applies level overrides and retains the original category at standard level', () => {
		expect(notificationCategoryForLevel(0, 'deviceWarning')).to.equal('deviceWarning');
		expect(notificationCategoryForLevel(1, 'deviceWarning')).to.equal(undefined);
		expect(notificationCategoryForLevel(2, 'deviceWarning')).to.equal('info');
		expect(notificationCategoryForLevel(3, 'deviceWarning')).to.equal('warnung');
		expect(notificationCategoryForLevel(4, 'deviceWarning')).to.equal('alarm');
		expect(notificationCategoryForLevel(undefined, 'deviceWarning')).to.equal('deviceWarning');
	});
});
