import { expect } from 'chai';
import { describe, it } from 'mocha';
import { formatResponseTimeSuffix } from './message-templates';

describe('message template response-time suffix', () => {
	it('formats localized warning and alarm response times', () => {
		expect(formatResponseTimeSuffix(5, 'de')).to.equal(' (Ansprechzeit 5 Minuten)');
		expect(formatResponseTimeSuffix(2.5, 'en')).to.equal(' (Response time 2.5 minutes)');
	});

	it('omits the suffix when no positive response time is configured', () => {
		expect(formatResponseTimeSuffix(undefined, 'de')).to.equal('');
		expect(formatResponseTimeSuffix(0, 'de')).to.equal('');
	});
});
