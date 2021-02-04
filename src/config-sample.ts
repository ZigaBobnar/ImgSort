import { SortConfig, DefaultConfig } from '../lib/sort/sortConfig';

const config: SortConfig = {
    ...DefaultConfig,
    ingestPath: './testing/ingest',
    outputPath: './testing/output',
    moveOptions: 'copy',
    mode: 'dryRun',
};

export default config;
