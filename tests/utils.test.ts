import { expect } from 'chai';
import { DefaultConfig, FileDate, SortConfig } from '../lib/sort';
import { formatOutputFolderName, getTimeForFileName } from '../lib/utils';

const testFileDate: FileDate = {
    day: '31',
    month: '12',
    year: '2021',
};

describe('utils', () => {
    describe('getTimeForFileName', () => {
        it('Get correct time for file name from current time', () => {
            const inputDate = new Date('2021-12-31T12:34:56.000Z');

            const result = getTimeForFileName(inputDate);

            expect(result).equal('2021-12-31T12.34.56');
        });
    });

    describe('formatOutputFolderName', () => {
        it('Format the output folder name (default config)', () => {
            const testConfig: SortConfig = {
                ...DefaultConfig,
            };

            const result = formatOutputFolderName(testConfig, testFileDate);

            expect(result).equal('2021/12-31');
        });

        it('Format the output folder name (split year and month-day - same as default)', () => {
            const testConfig: SortConfig = {
                ...DefaultConfig,
                outputFolderStructure: 'YYYY/MM-DD',
            };

            const result = formatOutputFolderName(testConfig, testFileDate);

            expect(result).equal('2021/12-31');
        });

        it('Format the output folder name (split year and month and then day)', () => {
            const testConfig: SortConfig = {
                ...DefaultConfig,
                outputFolderStructure: 'YYYY/MM/DD',
            };

            const result = formatOutputFolderName(testConfig, testFileDate);

            expect(result).equal('2021/12/31');
        });

        it('Format the output folder name (split year and year-month-day)', () => {
            const testConfig: SortConfig = {
                ...DefaultConfig,
                outputFolderStructure: 'YYYY/YYYY-MM-DD',
            };

            const result = formatOutputFolderName(testConfig, testFileDate);

            expect(result).equal('2021/2021-12-31');
        });

        it('Format the output folder name (year-month-day)', () => {
            const testConfig: SortConfig = {
                ...DefaultConfig,
                outputFolderStructure: 'YYYY-MM-DD',
            };

            const result = formatOutputFolderName(testConfig, testFileDate);

            expect(result).equal('2021-12-31');
        });
    });
});
