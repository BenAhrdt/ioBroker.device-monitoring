import { expect } from 'chai';
import { describe, it } from 'mocha';
import { createSummaryReminderMessage } from './reminders';

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
});
