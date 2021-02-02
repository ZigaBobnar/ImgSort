import fs from 'fs';
import { SortConfig } from './sortConfig';
import { ExecutorTasks, OutputTasks } from './tasks';
import { getTimeForFileName } from '../utils';
import { ExecutorInterface } from './interfaces';

class Executor implements ExecutorInterface {
    constructor(
        public readonly importDataFileName: string,
        public readonly config: SortConfig
    ) {}

    async execute(): Promise<string> {
        if (!fs.statSync(this.importDataFileName).isFile()) {
            throw `Import data file does not exist - ${this.importDataFileName}`;
        }

        let importData: OutputTasks;
        try {
            const data = fs.readFileSync(this.importDataFileName);
            importData = JSON.parse(data.toString());
        } catch (err) {
            throw `Error while reading the import data - ${err}`;
        }

        const tasks = await this.prepareTaskList(importData);
        this.saveTaskList(tasks);

        return this.runTasks(tasks);
    }

    prepareTaskList(tasks: OutputTasks): Promise<ExecutorTasks> {
        return Promise.resolve({
            mkdir: tasks.requiredDirectories,
            mv: tasks.moveTasks.map((t) => ({ old: t.inPath, new: t.outPath })),
        });
    }

    saveTaskList(tasks: ExecutorTasks): Promise<string> {
        try {
            const tasksListFileName = `${
                this.config.outputPath
            }/sort-task-list-${getTimeForFileName()}.json`;
            fs.writeFileSync(
                tasksListFileName,
                JSON.stringify(tasks, undefined, 4)
            );

            console.log(`Saved the tasks list as ${tasksListFileName}`);

            return Promise.resolve(tasksListFileName);
        } catch (err) {
            throw `Error while saving the tasks list - ${err}`;
        }
    }

    runTasks(tasks: ExecutorTasks): Promise<string> {
        const ranTasksFileName = `${
            this.config.outputPath
        }/sort-tasks-done-${getTimeForFileName()}.txt`;

        let taskList = '';
        try {
            for (const mkPath of tasks.mkdir) {
                console.log(`Creating directory ${mkPath}`);

                if (this.config.mode == 'normal') {
                    fs.mkdirSync(mkPath, { recursive: true });
                }
                taskList += `mkdir "${mkPath}"\n`;
            }
        } catch (err) {
            throw `Unable to make directory. Operation cannot continue - ${err}`;
        }
        fs.appendFileSync(ranTasksFileName, taskList);
        taskList = '';

        for (const mvFile of tasks.mv) {
            try {
                if (this.config.moveOptions == 'move') {
                    console.log(
                        `Moving file (move) ${mvFile.old} -> ${mvFile.new}`
                    );

                    if (this.config.mode == 'normal') {
                        fs.renameSync(mvFile.old, mvFile.new);
                    }

                    taskList += `mv "${mvFile.old}" "${mvFile.new}"\n`;
                } else if (this.config.moveOptions == 'copy') {
                    console.log(
                        `Moving file (copy) ${mvFile.old} -> ${mvFile.new}`
                    );

                    if (this.config.mode == 'normal') {
                        fs.copyFileSync(mvFile.old, mvFile.new);
                    }

                    taskList += `cp "${mvFile.old}" "${mvFile.new}"\n`;
                } else if (this.config.moveOptions == 'copyAndDeleteOld') {
                    console.log(
                        `Moving file (copy and delete old) ${mvFile.old} -> ${mvFile.new}`
                    );

                    if (this.config.mode == 'normal') {
                        fs.copyFileSync(mvFile.old, mvFile.new);
                        fs.unlinkSync(mvFile.old);
                    }

                    taskList += `cpRm "${mvFile.old}" "${mvFile.new}"\n`;
                } else if (this.config.moveOptions == 'ignore') {
                    console.log(
                        `Moving file (ignore) ${mvFile.old} -> ${mvFile.new}`
                    );

                    taskList += `ignore "${mvFile.old}" "${mvFile.new}"\n`;
                }
            } catch (err) {
                console.log(
                    `Unable to move file "${mvFile.old}" -> "${mvFile.new}" - ${err}`
                );
            }
        }
        fs.appendFileSync(ranTasksFileName, taskList);
        taskList = '';

        return Promise.resolve(ranTasksFileName);
    }
}

export { Executor };
