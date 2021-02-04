import { Importer } from '../lib/sort/importer';
import sortConfig from './config';
import { Executor } from '../lib/sort/executor';

const importer = new Importer(sortConfig);

importer.import().then(async (importDataFile) => {
    console.log(`Import done. Saved import data as ${importDataFile}`);

    const executor = new Executor(importDataFile, sortConfig);

    try {
        const operationLogName = await executor.execute();

        console.log(
            `Sort done. Log of operations is saved as ${operationLogName}`
        );
    } catch (err) {
        console.log(`Error during sorting - ${err}`);
    }
});
