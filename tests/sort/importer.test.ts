import { expect } from 'chai';
import Sinon, { mock } from 'sinon';
import { Importer } from '../../lib/sort/importer';
import { DefaultConfig } from '../../lib/sort/sortConfig';
import fs, { read } from 'fs';

describe('Importer', function () {
    beforeEach(function () {
        Sinon.stub(console, 'log');
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
        it('Find in empty root dir', async function () {
            const importer = new Importer(DefaultConfig);
            const readdirStub = Sinon.stub(fs, 'readdirSync').returns([]);

            const files = await importer.findFiles('');

            expect(files).to.be.empty;
            expect(readdirStub.calledOnce).to.be.true;
        });

        it('Find few files', async function () {
            const importer = new Importer(DefaultConfig);
            const readdirStub = Sinon.stub(fs, 'readdirSync').returns([
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
            ]);

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
            const importer = new Importer(DefaultConfig);
            const readdirStub = Sinon.stub(fs, 'readdirSync').throws(
                `Invalid path`
            );
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
            const importer = new Importer(DefaultConfig);
            const readdirStub = Sinon.stub(fs, 'readdirSync').throws(
                `Invalid path`
            );
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
            const importer = new Importer(DefaultConfig);
            const readdirStub = Sinon.stub(fs, 'readdirSync').throws(
                `Invalid path`
            );
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
});
