import { expect } from 'chai';
import { describe, it } from 'mocha';
import { notificationCategoryForTransition } from './notifications';

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
});
