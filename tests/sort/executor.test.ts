import { expect } from 'chai';
import Sinon, { SinonStub } from 'sinon';
import { Executor } from '../../lib/sort/executor';
import { DefaultConfig } from '../../lib/sort/sortConfig';
import fs from 'fs';
import { ExecutorTasks, OutputTasks } from '../../lib/sort/tasks';
import * as utils from '../../lib/utils';

describe('Executor', function () {
    let consoleLogStub: SinonStub;

    beforeEach(function () {
        consoleLogStub = Sinon.stub(console, 'log');
    });

    afterEach(function () {
        Sinon.restore();
    });

    describe('execute', function () {
        let statSyncStub: SinonStub;
        let readFileSyncStub: SinonStub;

        beforeEach(function () {
            statSyncStub = Sinon.stub(fs, 'statSync').throws();
            readFileSyncStub = Sinon.stub(fs, 'readFileSync').throws();
        });

        it('Calls the correct functions on execute, taskfile with empty arrays', async function () {
            statSyncStub.withArgs('./input-file.txt').returns({
                isFile: () => true,
            } as any);
            readFileSyncStub.returns(
                Buffer.from(`{
    "requiredDirectories": [],
    "moveTasks": [],
    "problematicFiles": []
}`)
            );
            const prepareTaskListStub = Sinon.stub(
                Executor.prototype,
                'prepareTaskList'
            ).resolves({
                mkdir: [],
                mv: [],
            });
            const saveTaskListStub = Sinon.stub(
                Executor.prototype,
                'saveTaskList'
            ).resolves('');
            const runTasksStub = Sinon.stub(
                Executor.prototype,
                'runTasks'
            ).resolves('./output-tasks-file.txt');

            const executor = new Executor('./input-file.txt', DefaultConfig);

            const tasksFileName = await executor.execute();

            expect(tasksFileName).to.be.eq('./output-tasks-file.txt');
            expect(statSyncStub.calledOnce).to.be.true;
            expect(readFileSyncStub.calledOnce).to.be.true;
            expect(prepareTaskListStub.calledOnce).to.be.true;
            expect(saveTaskListStub.calledOnce).to.be.true;
            expect(runTasksStub.calledOnce).to.be.true;
        });

        it('Throws error with empty taskfile', async function () {
            statSyncStub.withArgs('./input-file.txt').returns({
                isFile: () => true,
            } as any);
            readFileSyncStub.returns(Buffer.from(''));
            const prepareTaskListStub = Sinon.stub(
                Executor.prototype,
                'prepareTaskList'
            ).resolves({
                mkdir: [],
                mv: [],
            });
            const saveTaskListStub = Sinon.stub(
                Executor.prototype,
                'saveTaskList'
            ).resolves('');
            const runTasksStub = Sinon.stub(
                Executor.prototype,
                'runTasks'
            ).resolves('./output-tasks-file.txt');

            const executor = new Executor('./input-file.txt', DefaultConfig);

            let hasThrown = false;
            try {
                await executor.execute();
            } catch (err) {
                hasThrown = true;
            }

            expect(hasThrown).to.be.true;
            expect(statSyncStub.calledOnce).to.be.true;
            expect(readFileSyncStub.calledOnce).to.be.true;
            expect(prepareTaskListStub.notCalled).to.be.true;
            expect(saveTaskListStub.notCalled).to.be.true;
            expect(runTasksStub.notCalled).to.be.true;
        });
    });

    describe('prepareTaskList', function () {
        it('Returns empty task list on empty tasks input', async function () {
            const tasks: OutputTasks = {
                requiredDirectories: [],
                moveTasks: [],
                problematicFiles: [],
            };

            const executor = new Executor('', DefaultConfig);

            const result = await executor.prepareTaskList(tasks);

            expect(result).to.deep.equal({
                mkdir: [],
                mv: [],
            });
        });

        it('Create directories', async function () {
            const tasks: OutputTasks = {
                requiredDirectories: [
                    './output/2021/12-31',
                    './output/2021/11-30',
                    './output/2021/10-01',
                ],
                moveTasks: [],
                problematicFiles: [],
            };

            const executor = new Executor('', DefaultConfig);

            const result = await executor.prepareTaskList(tasks);

            expect(result).to.deep.equal({
                mkdir: [
                    './output/2021/12-31',
                    './output/2021/11-30',
                    './output/2021/10-01',
                ],
                mv: [],
            });
        });

        it('Move files', async function () {
            const tasks: OutputTasks = {
                requiredDirectories: [],
                moveTasks: [
                    {
                        inPath: './ingest/dir1/img1.jpg',
                        outPath: './output/2021/12-31/img1.jpg',
                    },
                    {
                        inPath: './ingest/dir2/dir3/img2.jpg',
                        outPath: './output/2021/11-30/img2.jpg',
                    },
                    {
                        inPath: './ingest/dir6/dir5/dir4/img3.jpg',
                        outPath: './output/2021/10-01/img3.jpg',
                    },
                ],
                problematicFiles: [],
            };

            const executor = new Executor('', DefaultConfig);

            const result = await executor.prepareTaskList(tasks);

            expect(result).to.deep.equal({
                mkdir: [],
                mv: [
                    {
                        old: './ingest/dir1/img1.jpg',
                        new: './output/2021/12-31/img1.jpg',
                    },
                    {
                        old: './ingest/dir2/dir3/img2.jpg',
                        new: './output/2021/11-30/img2.jpg',
                    },
                    {
                        old: './ingest/dir6/dir5/dir4/img3.jpg',
                        new: './output/2021/10-01/img3.jpg',
                    },
                ],
            });
        });

        it('Ignore problematic files', async function () {
            const tasks: OutputTasks = {
                requiredDirectories: [],
                moveTasks: [],
                problematicFiles: [
                    {
                        name: 'img1.txt',
                        path: './ingest/dir1',
                        date: {
                            year: '2021',
                            month: '12',
                            day: '31',
                        },
                        error: 'Cannot process file',
                    },
                    {
                        name: 'img2.txt',
                        path: './ingest/dir2/dir3',
                        date: {
                            year: '2021',
                            month: '11',
                            day: '30',
                        },
                        error: 'Cannot process file',
                    },
                    {
                        name: 'img3.txt',
                        path: './ingest/dir6/dir5/dir4',
                        date: {
                            year: '2021',
                            month: '12',
                            day: '31',
                        },
                    },
                ],
            };

            const executor = new Executor('', DefaultConfig);

            const result = await executor.prepareTaskList(tasks);

            expect(result).to.deep.equal({
                mkdir: [],
                mv: [],
            });
        });
    });

    describe('saveTaskList', function () {
        let getTimeForFileNameStub: SinonStub;
        let writeFileSyncStub: SinonStub;

        beforeEach(function () {
            getTimeForFileNameStub = Sinon.stub(utils, 'getTimeForFileName');
            writeFileSyncStub = Sinon.stub(fs, 'writeFileSync').throws();

            getTimeForFileNameStub.returns('____');
        });

        it('Saves empty task list', async function () {
            writeFileSyncStub.returns(null);

            const tasks: ExecutorTasks = {
                mkdir: [],
                mv: [],
            };

            const executor = new Executor('', DefaultConfig);

            const result = await executor.saveTaskList(tasks);

            expect(result).to.eq('./testing/output/sort-task-list-____.json');
            expect(getTimeForFileNameStub.calledOnce).to.be.true;
            expect(writeFileSyncStub.args[0]).to.deep.eq([
                './testing/output/sort-task-list-____.json',
                `{
    "mkdir": [],
    "mv": []
}`,
            ]);
            expect(writeFileSyncStub.calledOnce).to.be.true;
        });

        it('Saves the same tasks as input, with human readable formatting', async function () {
            writeFileSyncStub.returns(null);

            const tasks: ExecutorTasks = {
                mkdir: [
                    './output/2021/12-31',
                    './output/2021/11-30',
                    './output/2021/10-01',
                ],
                mv: [
                    {
                        old: './ingest/dir1/img1.jpg',
                        new: './output/2021/12-31/img1.jpg',
                    },
                    {
                        old: './ingest/dir2/dir3/img2.jpg',
                        new: './output/2021/11-30/img2.jpg',
                    },
                    {
                        old: './ingest/dir6/dir5/dir4/img3.jpg',
                        new: './output/2021/10-01/img3.jpg',
                    },
                ],
            };

            const executor = new Executor('', DefaultConfig);

            const result = await executor.saveTaskList(tasks);

            expect(result).to.eq('./testing/output/sort-task-list-____.json');
            expect(getTimeForFileNameStub.calledOnce).to.be.true;
            expect(writeFileSyncStub.args[0]).to.deep.eq([
                './testing/output/sort-task-list-____.json',
                `{
    "mkdir": [
        "./output/2021/12-31",
        "./output/2021/11-30",
        "./output/2021/10-01"
    ],
    "mv": [
        {
            "old": "./ingest/dir1/img1.jpg",
            "new": "./output/2021/12-31/img1.jpg"
        },
        {
            "old": "./ingest/dir2/dir3/img2.jpg",
            "new": "./output/2021/11-30/img2.jpg"
        },
        {
            "old": "./ingest/dir6/dir5/dir4/img3.jpg",
            "new": "./output/2021/10-01/img3.jpg"
        }
    ]
}`,
            ]);
            expect(writeFileSyncStub.calledOnce).to.be.true;
        });
    });

    describe('runTasks', function () {
        let getTimeForFileNameStub: SinonStub;
        let mkdirSyncStub: SinonStub;
        let appendFileSyncStub: SinonStub;
        let renameSyncStub: SinonStub;
        let copyFileSyncStub: SinonStub;
        let unlinkSyncStub: SinonStub;

        beforeEach(function () {
            getTimeForFileNameStub = Sinon.stub(utils, 'getTimeForFileName');
            mkdirSyncStub = Sinon.stub(fs, 'mkdirSync');
            appendFileSyncStub = Sinon.stub(fs, 'appendFileSync');
            renameSyncStub = Sinon.stub(fs, 'renameSync');
            copyFileSyncStub = Sinon.stub(fs, 'copyFileSync');
            unlinkSyncStub = Sinon.stub(fs, 'unlinkSync');

            getTimeForFileNameStub.returns('____');
        });

        it('Does nothing, still saves log for empty task list', async function () {
            let appendFileContents = '';
            appendFileSyncStub.callsFake((file, data) => {
                appendFileContents += data + '\n';
            });

            const tasks: ExecutorTasks = {
                mkdir: [],
                mv: [],
            };

            const executor = new Executor('', DefaultConfig);

            const result = await executor.runTasks(tasks);

            expect(result).to.eq('./testing/output/sort-tasks-done-____.txt');
            expect(appendFileContents).to.eq('\n\n');
            expect(getTimeForFileNameStub.calledOnce).to.be.true;
            expect(mkdirSyncStub.called).to.be.false;
            expect(appendFileSyncStub.called).to.be.true;
            expect(renameSyncStub.called).to.be.false;
            expect(copyFileSyncStub.called).to.be.false;
            expect(unlinkSyncStub.called).to.be.false;
        });
    });
});
