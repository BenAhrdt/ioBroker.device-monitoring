import { expect } from 'chai';
import { describe, it } from 'mocha';
import { configurationBackupNeedsUpdate } from './configuration-backup';

describe('device configuration backup', () => {
	const configuration = {
		devices: [{ id: 'device_001', name: 'Device', states: [] }],
		nextDeviceNumber: 2,
		functionTemplates: {},
	};

	it('does not update an identical backup', () => {
		expect(configurationBackupNeedsUpdate(configuration, structuredClone(configuration))).to.equal(false);
	});

	it('detects deeply nested configuration changes', () => {
		const backup = structuredClone(configuration);
		backup.devices[0].name = 'Old name';
		expect(configurationBackupNeedsUpdate(configuration, backup)).to.equal(true);
	});

	it('requires an update when no backup exists', () => {
		expect(configurationBackupNeedsUpdate(configuration, undefined)).to.equal(true);
	});
});
