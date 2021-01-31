import { expect } from 'chai';
import { getTimeForFileName } from '../lib/utils';

describe('Get correct time for file name from current time', () => {
    it('getTimeForFileName', () => {
        const inputDate = new Date('2021-12-31T12:34:56.000Z');

        const result = getTimeForFileName(inputDate);

        expect(result).equal('2021-12-31T12.34.56');
    });
});
