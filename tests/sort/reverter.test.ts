import { expect } from 'chai';
import fs from 'fs';
import Sinon, { SinonStub } from 'sinon';
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
