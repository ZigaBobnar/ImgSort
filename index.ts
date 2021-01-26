import { Sorter } from './lib/sort';
import sortConfig from './config';

const sorter = new Sorter(sortConfig);

sorter.start().then(() => {
    console.log('Done.')
})
