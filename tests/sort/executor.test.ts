import { expect } from 'chai';
import Sinon, { SinonStub } from 'sinon';
import { Executor } from '../../lib/sort/executor';
import { DefaultConfig } from '../../lib/sort/sortConfig';
import fs from 'fs';

describe('Executor', function () {
    let consoleLogStub: SinonStub;

    beforeEach(function () {
        consoleLogStub = Sinon.stub(console, 'log');
    });

    afterEach(function () {
        Sinon.restore();
    });

    describe('execute', function () {
        it('Calls the correct functions on execute, taskfile with empty arrays', async function () {
            const statSyncStub = Sinon.stub(fs, 'statSync')
                .withArgs('./input-file.txt')
                .returns({
                    isFile: () => true,
                } as any);
            const readFileSyncStub = Sinon.stub(fs, 'readFileSync').returns(
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
            const statSyncStub = Sinon.stub(fs, 'statSync')
                .withArgs('./input-file.txt')
                .returns({
                    isFile: () => true,
                } as any);
            const readFileSyncStub = Sinon.stub(fs, 'readFileSync').returns(
                Buffer.from('')
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

            let hasThrown = false;
            try {
                await executor.execute();
            }
            catch(err) {
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
});
