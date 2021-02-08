import fs from 'fs';
import { ReverterInterface } from './interfaces';
import { MoveTask } from './revertTypes';

class Reverter implements ReverterInterface {
    constructor(public readonly taskListPath: string) {}

    async revert(): Promise<void> {
        if (!fs.existsSync(this.taskListPath)) {
            throw 'Task file list does not exist.';
        }

        const oldMoveTasks = await this.parseTaskFile();
        await this.revertOldTasks(oldMoveTasks);
    }

    async parseTaskFile(): Promise<MoveTask[]> {
        const fileContents = fs.readFileSync(this.taskListPath).toString();
        const tasks = fileContents.split('\n');

        const moveTasks: MoveTask[] = [];
        for (const task of tasks) {
            const parsedTask = await this.extractTask(task);
            if (parsedTask) {
                moveTasks.push(parsedTask);
            }
        }

        return moveTasks;
    }

    extractTask(task: string): Promise<MoveTask | null> {
        const splitTask = task.split('"');

        const operation = splitTask[0]?.trim();
        if (operation == 'mv' || operation == 'cp' || operation == 'cpRm') {
            return Promise.resolve({
                moveType: operation,
                old: splitTask[1],
                new: splitTask[3],
            });
        } else if (
            operation &&
            operation !== 'mkdir' &&
            operation !== 'ignore'
        ) {
            console.log(`Unknown task operation ${operation}`);
        }

        return Promise.resolve(null);
    }

    revertOldTasks(oldMoveTasks: MoveTask[]): Promise<void> {
        for (const task of oldMoveTasks) {
            this.revertOldTask(task);
        }
        return Promise.resolve();
    }

    revertOldTask(task: MoveTask): Promise<void> {
        try {
            console.log(
                `Reverting (${task.moveType}) "${task.new}" into "${task.old}"`
            );
            if (task.moveType == 'mv') {
                if (fs.existsSync(task.old)) {
                    console.log(
                        `Old file exists. It will not be overwritten - ${task.old}`
                    );

                    return Promise.resolve();
                }

                fs.renameSync(task.new, task.old);
            } else if (task.moveType == 'cp' || task.moveType == 'cpRm') {
                if (task.old == task.new) {
                    return Promise.resolve();
                }

                if (!fs.existsSync(task.old)) {
                    fs.copyFileSync(task.new, task.old);
                }

                if (fs.existsSync(task.new)) {
                    fs.rmSync(task.new);
                }
            }
        } catch (err) {
            console.log(`Failed to revert ${task.old} - ${err}`);
        }

        return Promise.resolve();
    }
}

export { Reverter };
