import { expect } from 'chai';
import { describe, it } from 'mocha';
import {
	createNotificationCollectionSummaryMessage,
	createSummaryReminderMessage,
	summaryCategoryForItems,
} from './reminders';

describe('summary reminders', () => {
	it('does not create a message when no state is active', () => {
		expect(createSummaryReminderMessage([], 'de')).to.equal(undefined);
	});

	it('summarizes active states in the selected language', () => {
		expect(
			createSummaryReminderMessage(
				[
					{
						deviceName: 'Wohnzimmer',
						stateName: 'Temperatur',
						status: 'warning',
						sourceId: 'source.temperature',
						value: 29.4,
						unit: '°C',
						lastUpdate: null,
					},
					{
						deviceName: 'Keller',
						stateName: 'Rauch',
						status: 'invalid',
						sourceId: 'source.smoke',
						value: null,
						unit: '',
						lastUpdate: null,
					},
				],
				'de',
			),
		).to.deep.equal({
			title: 'Erinnerung: Aktive Gerätezustände',
			message:
				'Folgende überwachte Zustände sind aktuell nicht normal:\n' +
				'- Wohnzimmer / Temperatur: Warnung: 29.4 °C\n' +
				'- Keller / Rauch: Ungültige Quelle: source.smoke',
		});
	});

	it('uses the highest current status category for a summary', () => {
		expect(
			summaryCategoryForItems([
				{
					deviceName: 'Wohnzimmer',
					stateName: 'Temperatur',
					status: 'warning',
					sourceId: 'source.temperature',
					value: 29.4,
					unit: '°C',
					lastUpdate: null,
				},
				{
					deviceName: 'Keller',
					stateName: 'Rauch',
					status: 'timeout',
					sourceId: 'source.smoke',
					value: null,
					unit: '',
					lastUpdate: null,
				},
			]),
		).to.equal('alarm');
	});

	it('summarizes collected events with their effective categories', () => {
		expect(
			createNotificationCollectionSummaryMessage(
				[
					{
						deviceName: 'Wohnzimmer',
						stateName: 'Temperatur',
						category: 'warnung',
						title: 'Warnung',
						message: 'Wert zu niedrig',
						triggeredAt: 1_000,
					},
					{
						deviceName: 'Keller',
						stateName: 'Rauch',
						category: 'alarm',
						title: 'Alarm',
						message: 'Timeout',
						triggeredAt: 2_000,
					},
				],
				'de',
				1_000,
				2_000,
			),
		).to.deep.equal({
			title: 'Sammelbericht: Benachrichtigungen',
			message:
				'Im Zeitraum 1970-01-01 01:00:01 bis 1970-01-01 01:00:02 traten folgende Ereignisse auf:\n' +
				'- [Warnung] 1970-01-01 01:00:01 Wohnzimmer / Temperatur: Wert zu niedrig\n' +
				'- [Alarm] 1970-01-01 01:00:02 Keller / Rauch: Timeout',
		});
	});
});
