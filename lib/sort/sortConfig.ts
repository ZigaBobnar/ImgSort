export interface SortConfig {
    ingestPath: string;
    outputPath: string;
    moveOptions: 'move' | 'copy' | 'copyAndDeleteOld' | 'ignore';
    mode: 'dryRun' | 'normal';
}
