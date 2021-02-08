import { FileInfo } from './fileInfo';
import { ExecutorTasks, OutputTasks } from './tasks';
import { FilePath } from './fileInfo';
import { SortConfig } from './sortConfig';
import { MoveTask } from './revertTypes';

export interface ImporterInterface {
    readonly config: SortConfig;

    /**
     * Performs the import operations to find all files and create list of content.
     *
     * Returns the path to saved JSON task file.
     */
    import(): Promise<string>;

    /**
     * Finds all files inside specified path and its subdirectories.
     */
    findFiles(path: string): Promise<FilePath[]>;

    /**
     * Gets file information for each file.
     */
    getFileInfos(file: FilePath[]): Promise<FileInfo[]>;

    /**
     * Gets file information for specified file.
     */
    getFileInfo(file: FilePath): Promise<FileInfo>;

    /**
     * Prepares a list of tasks that are to be performed to sort content.
     */
    prepareOutputTasks(files: FileInfo[]): Promise<OutputTasks>;

    /**
     * Saves the tasks to file.
     *
     * Returns path to saved JSON task file.
     */
    writeImportData(outputTasks: OutputTasks): Promise<string>;
}

export interface ExecutorInterface {
    readonly importDataFileName: string;
    readonly config: SortConfig;

    /**
     * Performs the operations from task file.
     *
     * Returns the path to file with executed tasks log.
     */
    execute(): Promise<string>;

    /**
     * Converts the input file into task list usable by executor.
     */
    prepareTaskList(tasks: OutputTasks): Promise<ExecutorTasks>;

    /**
     * Saves the current tasks as JSON file.
     *
     * Returns the path to tasks list file.
     */
    saveTaskList(tasks: ExecutorTasks): Promise<string>;

    /**
     * Executes the tasks.
     *
     * Returns path to the file with executed tasks log.
     */
    runTasks(tasks: ExecutorTasks): Promise<string>;
}

export interface ReverterInterface {
    readonly taskListPath: string;

    /**
     * Tries to revert the tasks from executed tasks list.
     */
    revert(): Promise<void>;

    /**
     * Reads and processes tasks file into executed tasks.
     */
    parseTaskFile(): Promise<MoveTask[]>;

    /**
     * Extracts task from a single tasks file line.
     */
    extractTask(task: string): Promise<MoveTask | null>;

    /**
     * Performs revert tasks on every item.
     */
    revertOldTasks(oldMoveTasks: MoveTask[]): Promise<void>;

    /**
     * Performs revert tasks.
     */
    revertOldTask(oldMoveTask: MoveTask): Promise<void>;
}
