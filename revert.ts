import { Reverter } from './lib/sort';

const taskFile = process.argv[2];
if (!taskFile) {
    console.log('Task file path was not provided.');

    process.exit(-1);
}

const reverter = new Reverter(taskFile);
try {
    reverter.revert();
} catch (err) {
    console.log(`Unable to revert - ${err}`);

    process.exit(-1);
}
