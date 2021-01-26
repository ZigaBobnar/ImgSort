import { SortConfig } from '.';

class Sorter {
    constructor(private config: SortConfig) {}

    start() {
        console.log(this.config);
    }
}

export { Sorter };
