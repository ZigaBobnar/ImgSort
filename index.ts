import { Sorter } from './lib/sort';
import sortConfig from './config';

const initSort = () => {
    const sorter = new Sorter(sortConfig);

    sorter.start();
};

initSort();
