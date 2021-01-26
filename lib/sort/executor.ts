import fs from 'fs';
import { ExecutorTasks, OutputTasks, SortConfig } from '.';
import { getTimeForFileName } from '../utils';

class Executor {
    constructor(
        private importDataFileName: string,
        private config: SortConfig
    ) {}

    execute(): string {
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

        const tasks = this.prepareTaskList(importData);
        this.saveTaskList(tasks);

        return this.runTasks(tasks);
    }

    private prepareTaskList(tasks: OutputTasks): ExecutorTasks {
        return {
            mkdir: tasks.requiredDirectories,
            mv: tasks.moveTasks.map((t) => ({ old: t.inPath, new: t.outPath })),
        };
    }

    private saveTaskList(tasks: ExecutorTasks) {
        try {
            const tasksListFileName = `${
                this.config.outputPath
            }/sort-task-list-${getTimeForFileName()}.json`;
            fs.writeFileSync(
                tasksListFileName,
                JSON.stringify(tasks, undefined, 4)
            );

            console.log(`Saved the tasks list as ${tasksListFileName}`);
        } catch (err) {
            throw `Error while saving the tasks list - ${err}`;
        }
    }

    private runTasks(tasks: ExecutorTasks): string {
        const ranTasksFileName = `${
            this.config.outputPath
        }/sort-tasks-done-${getTimeForFileName()}.txt`;

        let taskList = '';
        try {
            for (const mkPath of tasks.mkdir) {
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
                    if (this.config.mode == 'normal') {
                        fs.renameSync(mvFile.old, mvFile.new);
                    }

                    taskList += `mv "${mvFile.old}" "${mvFile.new}"\n`;
                } else if (this.config.moveOptions == 'copy') {
                    if (this.config.mode == 'normal') {
                        fs.copyFileSync(mvFile.old, mvFile.new);
                    }

                    taskList += `cp "${mvFile.old}" "${mvFile.new}"\n`;
                } else if (this.config.moveOptions == 'copyAndDeleteOld') {
                    if (this.config.mode == 'normal') {
                        fs.copyFileSync(mvFile.old, mvFile.new);
                        fs.unlinkSync(mvFile.old);
                    }

                    taskList += `cpRm "${mvFile.old}" "${mvFile.new}"\n`;
                } else if (this.config.moveOptions == 'ignore') {
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

        return ranTasksFileName;
    }
}

export { Executor };
