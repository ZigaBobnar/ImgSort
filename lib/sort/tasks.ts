import { FileInfo } from '.';

export interface FileMoveTask {
    inPath: string;
    outPath: string;
}

export interface OutputTasks {
    requiredDirectories: string[];
    moveTasks: FileMoveTask[];
    problematicFiles: FileInfo[];
}

export interface ExecutorMoveTask {
    old: string;
    new: string;
}

export interface ExecutorTasks {
    mkdir: string[],
    mv: ExecutorMoveTask[],
}
