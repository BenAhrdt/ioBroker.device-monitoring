import { expect } from 'chai';
import { describe, it } from 'mocha';
import {
	notificationCategoryForEvent,
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
		expect(notificationCategoryForTransition('ok', 'invalidValue')).to.equal('invalidValue');
	});

	it('reports recovery only after a notified problem state', () => {
		expect(notificationCategoryForTransition('alarm', 'ok')).to.equal('deviceRecovered');
		expect(notificationCategoryForTransition('invalidValue', 'ok')).to.equal('deviceRecovered');
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
		expect(notificationLevelStateForCategory('invalidValue')).to.equal('invalidValue');
	});

	it('maps event categories to the configured general output categories', () => {
		expect(notificationCategoryForEvent('deviceWarning')).to.equal('warnung');
		expect(notificationCategoryForEvent('deviceAlarm')).to.equal('alarm');
		expect(notificationCategoryForEvent('deviceTimeout')).to.equal('alarm');
		expect(notificationCategoryForEvent('invalidSource')).to.equal('warnung');
		expect(notificationCategoryForEvent('invalidValue')).to.equal('warnung');
		expect(notificationCategoryForEvent('deviceRecovered')).to.equal('info');
	});

	it('applies level overrides while keeping standard output categories general', () => {
		expect(notificationCategoryForLevel(0, 'warnung')).to.equal('warnung');
		expect(notificationCategoryForLevel(1, 'warnung')).to.equal(undefined);
		expect(notificationCategoryForLevel(2, 'warnung')).to.equal('info');
		expect(notificationCategoryForLevel(3, 'warnung')).to.equal('warnung');
		expect(notificationCategoryForLevel(4, 'warnung')).to.equal('alarm');
		expect(notificationCategoryForLevel(undefined, 'warnung')).to.equal('warnung');
	});
});
