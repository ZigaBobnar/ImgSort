interface SortConfig {
    ingestPath: string;
    outputPath: string;
    moveOptions: 'move' | 'copy' | 'copyAndDeleteOld' | 'ignore';
    mode: 'dryRun' | 'normal';
    outputFolderStructure:
        | 'YYYY/MM/DD'
        | 'YYYY/MM-DD'
        | 'YYYY/YYYY-MM-DD'
        | 'YYYY-MM-DD';
}

const DefaultConfig: SortConfig = {
    ingestPath: './testing/ingest',
    outputPath: './testing/output',
    moveOptions: 'copy',
    mode: 'dryRun',
    outputFolderStructure: 'YYYY/MM-DD',
};

export { SortConfig, DefaultConfig };
