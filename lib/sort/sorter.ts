import fs from 'fs';
import { FileDate, FileInfo, SortConfig } from '.';
import { ExifImage } from 'exif';
import { FilePath } from './fileInfo';

export interface FileMoveTask {
    inPath: string;
    outPath: string;
}

export interface OutputTasks {
    requiredDirectories: string[];
    moveTasks: FileMoveTask[];
    problematicFiles: FileInfo[];
}

class Sorter {
    constructor(private config: SortConfig) {}

    async start(): Promise<void> {
        const files = this.findFiles(this.config.ingestPath);
        const fileInfos = await this.getFileInfos(files);

        const outputTask = this.prepareOutputTasks(fileInfos);

        this.writeReport(outputTask);

        console.log(outputTask);
    }

    private findFiles(path: string): FilePath[] {
        const files = fs.readdirSync(path, {
            withFileTypes: true,
        });

        let outFiles: FilePath[] = [];

        for (const file of files) {
            if (file.isDirectory()) {
                outFiles = [
                    ...outFiles,
                    ...this.findFiles(path + '/' + file.name),
                ];
            } else if (file.isFile()) {
                outFiles.push({ path, name: file.name });
            } else {
                console.log(`Unknown file type - ${file.name}`);
            }
        }

        return outFiles;
    }

    private async getFileInfos(files: FilePath[]): Promise<FileInfo[]> {
        const fileInfos: FileInfo[] = [];

        for (const file of files) {
            fileInfos.push(await this.getFileInfo(file));
        }

        return fileInfos;
    }

    private async getFileInfo(file: FilePath): Promise<FileInfo> {
        return new Promise<FileInfo>((resolve, reject) => {
            new ExifImage(
                { image: `${file.path}/${file.name}` },
                (error, data) => {
                    const originalDate =
                        data?.exif?.DateTimeOriginal ?? data?.exif?.CreateDate;
                    let date: FileDate | null = null;
                    if (originalDate) {
                        const splitDate = originalDate.split(':');

                        date = {
                            year: parseInt(splitDate[0]),
                            month: parseInt(splitDate[1]),
                            day: parseInt(splitDate[2]),
                        };
                    }

                    resolve({
                        path: file.path,
                        name: file.name,
                        date,
                    });
                }
            );
        });
    }

    private prepareOutputTasks(files: FileInfo[]): OutputTasks {
        const requiredDirectories: string[] = [];
        const moveTasks: FileMoveTask[] = [];
        const problematicFiles: FileInfo[] = [];

        for (const file of files) {
            if (
                file.date &&
                file.date.year &&
                file.date.month &&
                file.date.day
            ) {
                const outputDir = `${this.config.outputPath}/${file.date.year}/${file.date.month}/${file.date.day}`;

                if (!requiredDirectories.includes(outputDir)) {
                    requiredDirectories.push(outputDir);
                }

                moveTasks.push({
                    inPath: `${file.path}/${file.name}`,
                    outPath: `${outputDir}/${file.name}`,
                });
            } else {
                problematicFiles.push(file);
            }
        }

        return {
            requiredDirectories,
            moveTasks,
            problematicFiles,
        };
    }

    private writeReport(outputTasks: OutputTasks): void {
        if (!fs.existsSync(`${this.config.outputPath}`)) {
            fs.mkdirSync(`${this.config.outputPath}`);
        }

        const reportTime = new Date()
            .toISOString()
            .replace(/:/g, '.')
            .slice(0, 19);

        fs.writeFileSync(
            `${this.config.outputPath}/report-${reportTime}.json`,
            JSON.stringify(outputTasks, undefined, 4)
        );
    }
}

export { Sorter };
