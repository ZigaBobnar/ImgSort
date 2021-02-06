import { expect } from 'chai';
import Sinon, { SinonStub, SinonStubStatic } from 'sinon';
import { Importer } from '../../lib/sort/importer';
import { DefaultConfig } from '../../lib/sort/sortConfig';
import fs from 'fs';
import * as utils from '../../lib/utils';
import { OutputTasks } from '../../lib/sort/tasks';

describe('Importer', function () {
    let consoleLogStub: SinonStub;

    beforeEach(function () {
        consoleLogStub = Sinon.stub(console, 'log');
    });

    afterEach(function () {
        Sinon.restore();
    });

    describe('import', function () {
        it('Correct functions get called', async function () {
            const importer = new Importer(DefaultConfig);

            const findFilesStub = Sinon.stub(importer, 'findFiles').resolves(
                []
            );
            const getFileInfosStub = Sinon.stub(importer, 'getFileInfos');
            const prepareOutputTasksStub = Sinon.stub(
                importer,
                'prepareOutputTasks'
            );
            const writeImportDataStub = Sinon.stub(importer, 'writeImportData');

            await importer.import();

            expect(findFilesStub.calledOnce).to.be.true;
            expect(getFileInfosStub.calledOnce).to.be.true;
            expect(prepareOutputTasksStub.calledOnce).to.be.true;
            expect(writeImportDataStub.calledOnce).to.be.true;
        });
    });

    describe('findFiles', function () {
        let readdirStub: SinonStub;

        beforeEach(function () {
            readdirStub = Sinon.stub(fs, 'readdirSync').throws();
        });

        it('Find in empty root dir', async function () {
            readdirStub.returns([]);

            const importer = new Importer(DefaultConfig);

            const files = await importer.findFiles('');

            expect(files).to.be.empty;
            expect(readdirStub.calledOnce).to.be.true;
        });

        it('Find few files', async function () {
            readdirStub.returns([
                {
                    name: 'testFile.txt',
                    isDirectory: () => false,
                    isFile: () => true,
                } as any,
                {
                    name: 'ignoreNonFileNonDir',
                    isDirectory: () => false,
                    isFile: () => false,
                } as any,
                {
                    name: 'testImage.jpg',
                    isDirectory: () => false,
                    isFile: () => true,
                } as any,
            ]);

            const importer = new Importer(DefaultConfig);

            const files = await importer.findFiles('');

            expect(files.length).to.eq(2);
            expect(files).to.deep.equal([
                {
                    name: 'testFile.txt',
                    path: '',
                },
                {
                    name: 'testImage.jpg',
                    path: '',
                },
            ]);
            expect(readdirStub.calledOnce).to.be.true;
        });

        it('Find few files, search subdirectory', async function () {
            readdirStub.throws(`Invalid path`);
            readdirStub
                .withArgs(
                    '/root/testPath',
                    Sinon.match({ withFileTypes: true })
                )
                .returns([
                    {
                        name: 'testFile2.txt',
                        isDirectory: () => false,
                        isFile: () => true,
                    } as any,
                    {
                        name: 'testImage2.jpg',
                        isDirectory: () => false,
                        isFile: () => true,
                    } as any,
                    {
                        name: 'testImage3.jpg',
                        isDirectory: () => false,
                        isFile: () => true,
                    } as any,
                ]);
            readdirStub
                .withArgs('/root', Sinon.match({ withFileTypes: true }))
                .returns([
                    {
                        name: 'testFile.txt',
                        isDirectory: () => false,
                        isFile: () => true,
                    } as any,
                    {
                        name: 'testImage.jpg',
                        isDirectory: () => false,
                        isFile: () => true,
                    } as any,
                    {
                        name: 'testPath',
                        isDirectory: () => true,
                        isFile: () => false,
                    } as any,
                ]);

            const importer = new Importer(DefaultConfig);
            const files = await importer.findFiles('/root');

            expect(files.length).to.eq(5);
            expect(files).to.deep.equal([
                {
                    name: 'testFile.txt',
                    path: '/root',
                },
                {
                    name: 'testImage.jpg',
                    path: '/root',
                },
                {
                    name: 'testFile2.txt',
                    path: '/root/testPath',
                },
                {
                    name: 'testImage2.jpg',
                    path: '/root/testPath',
                },
                {
                    name: 'testImage3.jpg',
                    path: '/root/testPath',
                },
            ]);
            expect(readdirStub.callCount).to.be.eq(2);
        });

        it('Find few files, multiple subdirectory recursion', async function () {
            readdirStub.throws(`Invalid path`);
            readdirStub
                .withArgs(
                    '/root/path1/path2/path3',
                    Sinon.match({ withFileTypes: true })
                )
                .returns([
                    {
                        name: 'testFile3.txt',
                        isDirectory: () => false,
                        isFile: () => true,
                    } as any,
                    {
                        name: 'testImage.jpg',
                        isDirectory: () => false,
                        isFile: () => true,
                    } as any,
                ]);
            readdirStub
                .withArgs(
                    '/root/path1/path2',
                    Sinon.match({ withFileTypes: true })
                )
                .returns([
                    {
                        name: 'testFile2.txt',
                        isDirectory: () => false,
                        isFile: () => true,
                    } as any,
                    {
                        name: 'path3',
                        isDirectory: () => true,
                        isFile: () => false,
                    } as any,
                ]);
            readdirStub
                .withArgs('/root/path1', Sinon.match({ withFileTypes: true }))
                .returns([
                    {
                        name: 'testFile1.txt',
                        isDirectory: () => false,
                        isFile: () => true,
                    } as any,
                    {
                        name: 'path2',
                        isDirectory: () => true,
                        isFile: () => false,
                    } as any,
                ]);
            readdirStub
                .withArgs('/root', Sinon.match({ withFileTypes: true }))
                .returns([
                    {
                        name: 'testFile.txt',
                        isDirectory: () => false,
                        isFile: () => true,
                    } as any,
                    {
                        name: 'path1',
                        isDirectory: () => true,
                        isFile: () => false,
                    } as any,
                ]);

            const importer = new Importer(DefaultConfig);

            const files = await importer.findFiles('/root');

            expect(files.length).to.eq(5);
            expect(files).to.deep.equal([
                {
                    name: 'testFile.txt',
                    path: '/root',
                },
                {
                    name: 'testFile1.txt',
                    path: '/root/path1',
                },
                {
                    name: 'testFile2.txt',
                    path: '/root/path1/path2',
                },
                {
                    name: 'testFile3.txt',
                    path: '/root/path1/path2/path3',
                },
                {
                    name: 'testImage.jpg',
                    path: '/root/path1/path2/path3',
                },
            ]);
            expect(readdirStub.callCount).to.be.eq(4);
        });

        it('Find few files, empty subdirectories', async function () {
            readdirStub.throws(`Invalid path`);
            readdirStub
                .withArgs(
                    '/root/path1/path2/path3',
                    Sinon.match({ withFileTypes: true })
                )
                .returns([]);
            readdirStub
                .withArgs(
                    '/root/path1/path2',
                    Sinon.match({ withFileTypes: true })
                )
                .returns([
                    {
                        name: 'path3',
                        isDirectory: () => true,
                        isFile: () => false,
                    } as any,
                ]);
            readdirStub
                .withArgs('/root/path1', Sinon.match({ withFileTypes: true }))
                .returns([
                    {
                        name: 'testFile1.txt',
                        isDirectory: () => false,
                        isFile: () => true,
                    } as any,
                    {
                        name: 'path2',
                        isDirectory: () => true,
                        isFile: () => false,
                    } as any,
                ]);
            readdirStub
                .withArgs('/root', Sinon.match({ withFileTypes: true }))
                .returns([
                    {
                        name: 'path1',
                        isDirectory: () => true,
                        isFile: () => false,
                    } as any,
                ]);

            const importer = new Importer(DefaultConfig);

            const files = await importer.findFiles('/root');

            expect(files.length).to.eq(1);
            expect(files).to.deep.equal([
                {
                    name: 'testFile1.txt',
                    path: '/root/path1',
                },
            ]);
            expect(readdirStub.callCount).to.be.eq(4);
        });
    });

    describe('getFileInfos', function () {
        it('Returns empty on empty input', async function () {
            const getFileInfoStub = Sinon.stub(
                Importer.prototype,
                'getFileInfo'
            ).resolves({} as any);

            const importer = new Importer(DefaultConfig);

            const fileInfos = await importer.getFileInfos([]);

            expect(fileInfos).to.be.empty;
            expect(getFileInfoStub.notCalled).to.be.true;
        });

        it('Calls getFileInfo for each file', async function () {
            const getFileInfoStub = Sinon.stub(
                Importer.prototype,
                'getFileInfo'
            ).resolves({} as any);

            const importer = new Importer(DefaultConfig);

            const fileInfos = await importer.getFileInfos([
                {
                    name: 'testFile.txt',
                    path: '/root',
                },
                {
                    name: 'testFile1.txt',
                    path: '/root/path1',
                },
                {
                    name: 'testFile2.txt',
                    path: '/root/path1/path2',
                },
                {
                    name: 'testFile3.txt',
                    path: '/root/path1/path2/path3',
                },
                {
                    name: 'testImage.jpg',
                    path: '/root/path1/path2/path3',
                },
            ]);

            expect(fileInfos.length).to.be.eq(5);
            expect(getFileInfoStub.callCount).to.be.eq(5);
        });
    });

    describe('getFileInfo', function () {
        let readFileStub: SinonStub;
        let statSyncStub: SinonStub;

        beforeEach(function () {
            readFileStub = Sinon.stub(fs, 'readFile');
            statSyncStub = Sinon.stub(fs, 'statSync');
        });

        it('Missing file returns error result with null date', async function () {
            readFileStub.yields(null, Buffer.from(''));
            statSyncStub.returns(({} as any) as fs.Stats);

            const importer = new Importer(DefaultConfig);

            const fileInfo = await importer.getFileInfo({
                name: 'testFile3.txt',
                path: '/root/path1/path2/path3',
            });

            expect(fileInfo).to.deep.eq({
                name: 'testFile3.txt',
                path: '/root/path1/path2/path3',
                date: null,
                error:
                    'The given image is not a JPEG and thus unsupported right now.',
            });
            expect(readFileStub.calledOnce).to.be.true;
            expect(statSyncStub.calledOnce).to.be.true;
        });

        it('Non Exif parseable file returns error result with file modified date', async function () {
            const fakeDate = new Date('2021-11-06T21:43:56.000Z');
            readFileStub.yields(null, Buffer.from(''));
            statSyncStub.returns(({
                mtime: fakeDate,
            } as any) as fs.Stats);

            const importer = new Importer(DefaultConfig);

            const fileInfo = await importer.getFileInfo({
                name: 'testFile3.txt',
                path: '/root/path1/path2/path3',
            });

            expect(fileInfo).to.deep.eq({
                name: 'testFile3.txt',
                path: '/root/path1/path2/path3',
                date: {
                    year: '2021',
                    month: '11',
                    day: '06',
                },
                error:
                    'The given image is not a JPEG and thus unsupported right now.',
            });
            expect(readFileStub.calledOnce).to.be.true;
            expect(statSyncStub.calledOnce).to.be.true;
        });

        it('Exif parseable file returns correct date', async function () {
            readFileStub.yields(
                null,
                fs.readFileSync('./tests/testdata/sampleImg.jpg')
            );

            const importer = new Importer(DefaultConfig);

            const fileInfo = await importer.getFileInfo({
                name: 'testFile3.txt',
                path: '/root/path1/path2/path3',
            });

            expect(fileInfo).to.deep.eq({
                name: 'testFile3.txt',
                path: '/root/path1/path2/path3',
                date: {
                    year: '2001',
                    month: '04',
                    day: '06',
                },
            });
            expect(readFileStub.calledOnce).to.be.true;
        });

        it('Exif parseable file without date returns null date', async function () {
            readFileStub.yields(
                null,
                fs.readFileSync(
                    './tests/testdata/sampleImg_without_exif_date.jpg'
                )
            );

            const importer = new Importer(DefaultConfig);

            const fileInfo = await importer.getFileInfo({
                name: 'testFile3.txt',
                path: '/root/path1/path2/path3',
            });

            expect(fileInfo).to.deep.eq({
                name: 'testFile3.txt',
                path: '/root/path1/path2/path3',
                date: null,
            });
            expect(readFileStub.calledOnce).to.be.true;
        });
    });

    describe('prepareOutputTasks', function () {
        it('Empty files array produces empty taskfile', async function () {
            const importer = new Importer(DefaultConfig);

            const outputTasks = await importer.prepareOutputTasks([]);

            expect(outputTasks).to.deep.eq({
                requiredDirectories: [],
                moveTasks: [],
                problematicFiles: [],
            });
        });

        it('Create correct tasks for complex tree', async function () {
            const importer = new Importer(DefaultConfig);

            const outputTasks = await importer.prepareOutputTasks([
                {
                    name: 'testFile.jpg',
                    path: '/root',
                    date: {
                        year: '2001',
                        month: '04',
                        day: '06',
                    },
                },
                {
                    name: 'testFile1.jpg',
                    path: '/root/path1',
                    date: {
                        year: '2021',
                        month: '12',
                        day: '31',
                    },
                },
                {
                    name: 'testFile2.jpg',
                    path: '/root/path1/path2',
                    date: {
                        year: '2021',
                        month: '12',
                        day: '31',
                    },
                },
                {
                    name: 'testFile3.txt',
                    path: '/root/path1/path2/path3',
                    date: {
                        year: '2001',
                        month: '04',
                        day: '06',
                    },
                    error:
                        'The given image is not a JPEG and thus unsupported right now.',
                },
                {
                    name: 'testImage.jpg',
                    path: '/root/path1/path2/path3',
                    date: null,
                    error: 'Cannot read file?',
                },
            ]);

            expect(outputTasks).to.deep.eq({
                requiredDirectories: [
                    './testing/output/2001/04-06',
                    './testing/output/2021/12-31',
                ],
                moveTasks: [
                    {
                        inPath: '/root/testFile.jpg',
                        outPath: './testing/output/2001/04-06/testFile.jpg',
                    },
                    {
                        inPath: '/root/path1/testFile1.jpg',
                        outPath: './testing/output/2021/12-31/testFile1.jpg',
                    },
                    {
                        inPath: '/root/path1/path2/testFile2.jpg',
                        outPath: './testing/output/2021/12-31/testFile2.jpg',
                    },
                ],
                problematicFiles: [
                    {
                        name: 'testFile3.txt',
                        path: '/root/path1/path2/path3',
                        date: {
                            day: '06',
                            month: '04',
                            year: '2001',
                        },
                        error:
                            'The given image is not a JPEG and thus unsupported right now.',
                    },
                    {
                        name: 'testImage.jpg',
                        path: '/root/path1/path2/path3',
                        date: null,
                        error: 'Cannot read file?',
                    },
                ],
            });
        });
    });

    describe('writeImportData', function () {
        let existsSyncStub: SinonStub;
        let writeFileSyncStub: SinonStub;
        let mkdirSyncStub: SinonStub;
        let getTimeForFileNameStub: SinonStub;

        beforeEach(function () {
            existsSyncStub = Sinon.stub(fs, 'existsSync').throws();            
            writeFileSyncStub = Sinon.stub(fs, 'writeFileSync').throws();
            mkdirSyncStub = Sinon.stub(fs, 'mkdirSync').throws();
            getTimeForFileNameStub = Sinon.stub(utils, 'getTimeForFileName');

            getTimeForFileNameStub.returns('0000-0000');
        });

        it('Empty tasks make empty import data file', async function () {
            existsSyncStub.returns(true);
            writeFileSyncStub.returns(null);

            const tasks: OutputTasks = {
                requiredDirectories: [],
                moveTasks: [],
                problematicFiles: [],
            };

            const importer = new Importer(DefaultConfig);

            const importDataFile = await importer.writeImportData(tasks);

            expect(importDataFile).to.eq(
                './testing/output/import-0000-0000.json'
            );
            expect(existsSyncStub.calledOnce).to.be.true;
            expect(getTimeForFileNameStub.calledOnce).to.be.true;
            expect(writeFileSyncStub.calledOnce).to.be.true;
            expect(writeFileSyncStub.firstCall.args).to.be.deep.eq([
                './testing/output/import-0000-0000.json',
                `{
    "requiredDirectories": [],
    "moveTasks": [],
    "problematicFiles": []
}`,
            ]);
        });

        it('Creates output dir if it does not exist', async function () {
            existsSyncStub.returns(false);
            mkdirSyncStub.returns(null);
            writeFileSyncStub.returns(null);

            const tasks: OutputTasks = {
                requiredDirectories: [],
                moveTasks: [],
                problematicFiles: [],
            };

            const importer = new Importer(DefaultConfig);

            const importDataFile = await importer.writeImportData(tasks);

            expect(importDataFile).to.eq(
                './testing/output/import-0000-0000.json'
            );
            expect(existsSyncStub.calledOnce).to.be.true;
            expect(mkdirSyncStub.calledOnce).to.be.true;
            expect(getTimeForFileNameStub.calledOnce).to.be.true;
            expect(writeFileSyncStub.calledOnce).to.be.true;
            expect(writeFileSyncStub.firstCall.args).to.be.deep.eq([
                './testing/output/import-0000-0000.json',
                `{
    "requiredDirectories": [],
    "moveTasks": [],
    "problematicFiles": []
}`,
            ]);
        });
    });
});
