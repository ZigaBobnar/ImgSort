import { expect } from 'chai';
import fs from 'fs';
import Sinon, { SinonStub, SinonStubbedInstance } from 'sinon';
import { Reverter } from '../../lib/sort/reverter';
import { MoveTask } from '../../lib/sort/revertTypes';

describe('Reverter', function () {
    let consoleStub: SinonStub;

    beforeEach(function () {
        consoleStub = Sinon.stub(console, 'log');
    });

    afterEach(function () {
        Sinon.restore();
    });

    describe('revert', function () {
        let existsSyncStub: SinonStub;

        beforeEach(function () {
            existsSyncStub = Sinon.stub(fs, 'existsSync').throws();
        });

        it('Runs the tasks from parsed task file', async function () {
            existsSyncStub.returns(true);

            const moveTasks: MoveTask[] = [];
            const parseTaskFileStub = Sinon.stub(
                Reverter.prototype,
                'parseTaskFile'
            ).resolves(moveTasks);
            const revertOldTasksStub = Sinon.stub(
                Reverter.prototype,
                'revertOldTasks'
            );

            const reverter = new Reverter('./task-file.json');

            await reverter.revert();

            expect(existsSyncStub.calledOnce).to.be.true;
            expect(parseTaskFileStub.calledOnce).to.be.true;
            expect(revertOldTasksStub.calledOnce).to.be.true;
            expect(revertOldTasksStub.args[0][0]).to.equal(moveTasks);
        });

        it('Fails if task file does not exist', async function () {
            existsSyncStub.returns(false);
            Sinon.stub(Reverter.prototype, 'parseTaskFile').throws();
            Sinon.stub(Reverter.prototype, 'revertOldTasks').throws();

            const reverter = new Reverter('./file-that-does-not-exist.txt');

            let hasThrown = false;
            try {
                await reverter.revert();
            } catch (err) {
                hasThrown = true;
            }

            expect(existsSyncStub.calledOnce).to.be.true;
            expect(hasThrown).to.be.true;
        });
    });

    describe('parseTaskFile', function () {
        let readFileSyncStub: SinonStub;

        beforeEach(function () {
            readFileSyncStub = Sinon.stub(fs, 'readFileSync').throws();
        });

        it('Reads file, splits by lines and returns extracted task', async function () {
            readFileSyncStub
                .withArgs('./task-file.txt')
                .returns(Buffer.from(testTaskFileContents));
            const extractTaskStub = Sinon.stub(
                Reverter.prototype,
                'extractTask'
            )
                .withArgs(Sinon.match((val) => val.length != 0))
                .resolves({} as any);

            const reverter = new Reverter('./task-file.txt');

            const parsedResult = await reverter.parseTaskFile();

            expect(readFileSyncStub.calledOnce).to.be.true;
            expect(extractTaskStub.callCount).to.equal(8);
            expect(parsedResult.length).to.eq(8);
        });

        it('Reads empty file', async function () {
            readFileSyncStub
                .withArgs('./task-file.txt')
                .returns(Buffer.from(''));
            const extractTaskStub = Sinon.stub(
                Reverter.prototype,
                'extractTask'
            )
                .withArgs(Sinon.match((val) => val.length != 0))
                .resolves({} as any);

            const reverter = new Reverter('./task-file.txt');

            const parsedResult = await reverter.parseTaskFile();

            expect(readFileSyncStub.calledOnce).to.be.true;
            expect(extractTaskStub.callCount).to.equal(0);
            expect(parsedResult.length).to.eq(0);
        });
    });

    describe('extractTask', function () {
        it('Returns null on empty input', async function () {
            const reverter = new Reverter('./task-file.txt');

            const extractedTask = await reverter.extractTask('');

            expect(extractedTask).to.be.null;
        });

        it('Returns null on unknown operation', async function () {
            const reverter = new Reverter('./task-file.txt');

            const extractedTask = await reverter.extractTask(testTasks.unknown);

            expect(extractedTask).to.be.null;
        });

        it('Extracts move task', async function () {
            const reverter = new Reverter('./task-file.txt');

            const extractedTask = await reverter.extractTask(testTasks.mv);

            expect(extractedTask).to.deep.eq({
                moveType: 'mv',
                old: './testing/ingest/DCIM/Camera/IMG_20219403_942309.jpg',
                new: './testing/output/2021/12-31/IMG_20219403_942309.jpg',
            });
        });

        it('Extracts copy task', async function () {
            const reverter = new Reverter('./task-file.txt');

            const extractedTask = await reverter.extractTask(testTasks.cp);

            expect(extractedTask).to.deep.eq({
                moveType: 'cp',
                old: './testing/ingest/DCIM/Camera/IMG_20219403_942309.jpg',
                new: './testing/output/2021/12-31/IMG_20219403_942309.jpg',
            });
        });

        it('Extracts copy-remove task', async function () {
            const reverter = new Reverter('./task-file.txt');

            const extractedTask = await reverter.extractTask(testTasks.cpRm);

            expect(extractedTask).to.deep.eq({
                moveType: 'cpRm',
                old: './testing/ingest/DCIM/Camera/IMG_20219403_942309.jpg',
                new: './testing/output/2021/12-31/IMG_20219403_942309.jpg',
            });
        });
    });

    describe('revertOldTasks', function () {
        let revertOldTaskStub: SinonStub;

        beforeEach(function () {
            revertOldTaskStub = Sinon.stub(Reverter.prototype, 'revertOldTask');
            revertOldTaskStub.rejects();
        });

        it('Does nothing when no tasks are present', async function () {
            const reverter = new Reverter('./task-file.txt');

            await reverter.revertOldTasks([]);

            expect(revertOldTaskStub.called).to.be.false;
        });

        it('Calls revert for each task', async function () {
            revertOldTaskStub.withArgs(testMoveTasks[0]).resolves();
            revertOldTaskStub.withArgs(testMoveTasks[1]).resolves();
            revertOldTaskStub.withArgs(testMoveTasks[2]).resolves();

            const reverter = new Reverter('./task-file.txt');

            await reverter.revertOldTasks(testMoveTasks);

            expect(revertOldTaskStub.callCount).to.eq(3);
            expect(revertOldTaskStub.args[0][0]).to.deep.eq(testMoveTasks[0]);
            expect(revertOldTaskStub.args[1][0]).to.deep.eq(testMoveTasks[1]);
            expect(revertOldTaskStub.args[2][0]).to.deep.eq(testMoveTasks[2]);
        });
    });

    describe('revertOldTask', function () {
        let fsStub: SinonStubbedInstance<typeof fs>;

        beforeEach(function () {
            fsStub = Sinon.stub(fs);
            fsStub.existsSync.throws();
            fsStub.renameSync.throws();
            fsStub.copyFileSync.throws();
            fsStub.unlinkSync.throws();
        });

        it('Moves file to old location (mv)', async function () {
            const task = testMoveTasks[1];
            fsStub.existsSync.withArgs(task.old).returns(false);
            fsStub.renameSync.withArgs(task.new, task.old).returns();

            const reverter = new Reverter('./task-file.txt');

            await reverter.revertOldTask(task);

            expect(fsStub.existsSync.calledOnce).to.be.true;
            expect(fsStub.renameSync.calledOnce).to.be.true;
        });

        it('Does nothing when moving file to old location ant old file exists (mv)', async function () {
            const task = testMoveTasks[1];
            fsStub.existsSync.withArgs(task.old).returns(true);

            const reverter = new Reverter('./task-file.txt');

            await reverter.revertOldTask(task);

            expect(fsStub.existsSync.calledOnce).to.be.true;
            expect(fsStub.renameSync.called).to.be.false;
        });

        it('Copies file to old location and deletes the old-new file (cp)', async function () {
            const task = testMoveTasks[0];
            fsStub.existsSync.withArgs(task.old).returns(false);
            fsStub.existsSync.withArgs(task.new).returns(true);
            fsStub.copyFileSync.withArgs(task.new, task.old).returns();

            const reverter = new Reverter('./task-file.txt');

            await reverter.revertOldTask(task);

            expect(fsStub.existsSync.calledTwice).to.be.true;
            expect(fsStub.copyFileSync.calledOnce).to.be.true;
            expect(fsStub.unlinkSync.calledOnce).to.be.true;
        });

        it('Does nothing if file paths are same (cp)', async function () {
            const task: MoveTask = {
                moveType: 'cp',
                new: './file/1',
                old: './file/1',
            };
            fsStub.existsSync.withArgs(task.old).returns(false);
            fsStub.existsSync.withArgs(task.new).returns(true);
            fsStub.copyFileSync.withArgs(task.new, task.old).returns();

            const reverter = new Reverter('./task-file.txt');

            await reverter.revertOldTask(task);

            expect(fsStub.existsSync.called).to.be.false;
            expect(fsStub.copyFileSync.called).to.be.false;
            expect(fsStub.unlinkSync.called).to.be.false;
        });

        it('Copies file to old location and deletes the old-new file (cpRm)', async function () {
            const task = testMoveTasks[2];
            fsStub.existsSync.withArgs(task.old).returns(false);
            fsStub.existsSync.withArgs(task.new).returns(true);
            fsStub.copyFileSync.withArgs(task.new, task.old).returns();

            const reverter = new Reverter('./task-file.txt');

            await reverter.revertOldTask(task);

            expect(fsStub.existsSync.calledTwice).to.be.true;
            expect(fsStub.copyFileSync.calledOnce).to.be.true;
            expect(fsStub.unlinkSync.calledOnce).to.be.true;
        });
    });
});

const testTaskFileContents = `mkdir "./testing/output/2021/12-31"
mkdir "./testing/output/2021/12-30"
mkdir "./testing/output/2021/11-10"
mkdir "./testing/output/2020/01-01"
cp "./testing/ingest/DCIM/Camera/IMG_20219403_942309.jpg" "./testing/output/2021/12-31/IMG_20219403_942309.jpg"
cp "./testing/ingest/DCIM/Camera/IMG_20214930_943009.jpg" "./testing/output/2021/12-30/IMG_20214930_943009.jpg"
cp "./testing/ingest/DCIM/Camera/IMG_20214390_439090.jpg" "./testing/output/2021/11-10/IMG_20214390_439090.jpg"
cp "./testing/ingest/DCIM/Camera/IMG_20204930_439099.jpg" "./testing/output/2020/01-01/IMG_20214930_439099.jpg"
`;

const testTasks = {
    mkdir: 'mkdir "./testing/output/2021/12-31"',
    mv:
        'mv "./testing/ingest/DCIM/Camera/IMG_20219403_942309.jpg" "./testing/output/2021/12-31/IMG_20219403_942309.jpg"',
    cp:
        'cp "./testing/ingest/DCIM/Camera/IMG_20219403_942309.jpg" "./testing/output/2021/12-31/IMG_20219403_942309.jpg"',
    cpRm:
        'cpRm "./testing/ingest/DCIM/Camera/IMG_20219403_942309.jpg" "./testing/output/2021/12-31/IMG_20219403_942309.jpg"',
    unknown: 'op foo bar',
};

const testMoveTasks: MoveTask[] = [
    {
        moveType: 'cp',
        new: './out/1',
        old: './in/1',
    },
    {
        moveType: 'mv',
        new: './out/2',
        old: './in/2',
    },
    {
        moveType: 'cpRm',
        new: './out/3',
        old: './in/3',
    },
];
