import { Importer } from './lib/sort';
import sortConfig from './config';
import { Executor } from './lib/sort/executor';

const importer = new Importer(sortConfig);

importer.import().then((importDataFile) => {
    console.log(`Import done. Saved import data as ${importDataFile}`);

    const executor = new Executor(importDataFile, sortConfig);

    try {
        const operationLogName = executor.execute();

        console.log(`Sort done. Log of operations is saved as ${operationLogName}`);
    } catch (err) {
        console.log(`Error during sorting - ${err}`);
    }
});
