import fs from 'fs';
import { parse } from 'path';

class Reverter {
    constructor(private taskListPath: string) {}

    revert(): void {
        if (!fs.existsSync(this.taskListPath)) {
            throw 'Task file list does not exist.';
        }

        const oldMoveTasks = this.parseTaskFile();
        this.revertOldTasks(oldMoveTasks);
    }

    private parseTaskFile(): MoveTask[] {
        const fileContents = fs.readFileSync(this.taskListPath).toString();
        const tasks = fileContents.split('\n');

        const moveTasks: MoveTask[] = [];
        for (const task of tasks) {
            const parsedTask = this.extractTask(task);
            if (parsedTask) {
                moveTasks.push(parsedTask);
            }
        }

        return moveTasks;
    }

    private extractTask(task: string): MoveTask | null {
        const splitTask = task.split('"');

        const operation = splitTask[0]?.trim();
        if (operation == 'mv' || operation == 'cp' || operation == 'cpRm') {
            return {
                moveType: operation,
                old: splitTask[1],
                new: splitTask[3],
            };
        } else if (
            operation &&
            operation !== 'mkdir' &&
            operation !== 'ignore'
        ) {
            console.log(`Unknown task operation ${operation}`);
        }

        return null;
    }

    private revertOldTasks(oldMoveTasks: MoveTask[]) {
        for (const task of oldMoveTasks) {
            try {
                console.log(
                    `Reverting (${task.moveType}) "${task.new}" into "${task.old}"`
                );
                if (task.moveType == 'mv') {
                    if (fs.existsSync(task.old)) {
                        console.log(
                            `Old file exists. It will not be overwritten - ${task.old}`
                        );
                        continue;
                    }

                    fs.renameSync(task.new, task.old);
                } else if (task.moveType == 'cp' || task.moveType == 'cpRm') {
                    if (task.old == task.new) {
                        continue;
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
        }
    }
}

type MoveTask = {
    moveType: 'mv' | 'cp' | 'cpRm';
    old: string;
    new: string;
};

export { Reverter };
