import { Importer } from './lib/sort';
import sortConfig from './config';

const importer = new Importer(sortConfig);

importer.import().then((importDataFile) => {
    console.log(`Import done. Saved import data as ${importDataFile}`)
})
