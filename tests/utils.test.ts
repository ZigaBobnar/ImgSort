import { expect } from 'chai';
import { DefaultConfig, SortConfig } from '../lib/sort/sortConfig';
import { FileDate } from '../lib/sort/fileInfo';
import { formatOutputFolderName, getTimeForFileName } from '../lib/utils';

describe('utils', function () {
    describe('getTimeForFileName', function () {
        it('Get correct time for file name from input time', function () {
            const inputDate = new Date('2021-12-31T12:34:56.000Z');

            const result = getTimeForFileName(inputDate);

            expect(result).equal('2021-12-31T12.34.56');
        });

        it('Get correct time for file name from "current" time', function () {
            const fakeDate = new Date('2021-11-26T21:43:56.000Z');
            const originalDateNow = Date.now;
            Date.now = () => fakeDate.getTime();

            const result = getTimeForFileName();

            Date.now = originalDateNow;

            expect(result).equal('2021-11-26T21.43.56');
        });
    });

    describe('formatOutputFolderName', function () {
        const testFileDate: FileDate = {
            day: '31',
            month: '12',
            year: '2021',
        };

        it('Format the output folder name (default config)', function () {
            const testConfig: SortConfig = {
                ...DefaultConfig,
            };

            const result = formatOutputFolderName(testConfig, testFileDate);

            expect(result).equal('2021/12-31');
        });

        it('Format the output folder name (split year and month-day - same as default)', function () {
            const testConfig: SortConfig = {
                ...DefaultConfig,
                outputFolderStructure: 'YYYY/MM-DD',
            };

            const result = formatOutputFolderName(testConfig, testFileDate);

            expect(result).equal('2021/12-31');
        });

        it('Format the output folder name (split year and month and then day)', function () {
            const testConfig: SortConfig = {
                ...DefaultConfig,
                outputFolderStructure: 'YYYY/MM/DD',
            };

            const result = formatOutputFolderName(testConfig, testFileDate);

            expect(result).equal('2021/12/31');
        });

        it('Format the output folder name (split year and year-month-day)', function () {
            const testConfig: SortConfig = {
                ...DefaultConfig,
                outputFolderStructure: 'YYYY/YYYY-MM-DD',
            };

            const result = formatOutputFolderName(testConfig, testFileDate);

            expect(result).equal('2021/2021-12-31');
        });

        it('Format the output folder name (year-month-day)', function () {
            const testConfig: SortConfig = {
                ...DefaultConfig,
                outputFolderStructure: 'YYYY-MM-DD',
            };

            const result = formatOutputFolderName(testConfig, testFileDate);

            expect(result).equal('2021-12-31');
        });

        it('Format the output folder name (null date => null result)', function () {
            const testConfig: SortConfig = {
                ...DefaultConfig,
                outputFolderStructure: 'YYYY-MM-DD',
            };
            const testDate: FileDate = {};

            const result = formatOutputFolderName(testConfig, testDate);

            expect(result).eq(null);
        });
    });
});
