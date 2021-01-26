import fs from 'fs';
import { FileDate, FileInfo, FileMoveTask, OutputTasks, SortConfig } from '.';
import { ExifImage } from 'exif';
import { FilePath } from './fileInfo';
import { getTimeForFileName } from '../utils';

class Importer {
    constructor(private config: SortConfig) {}

    async import(): Promise<string> {
        const files = this.findFiles(this.config.ingestPath);
        const fileInfos = await this.getFileInfos(files);
        const outputTasks = this.prepareOutputTasks(fileInfos);

        return this.writeImportData(outputTasks);
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
                    if (error) {
                        const modifiedTime = fs.statSync(
                            `${file.path}/${file.name}`
                        ).mtime;

                        return resolve({
                            path: file.path,
                            name: file.name,
                            date: modifiedTime
                                ? {
                                      year: `${modifiedTime.getFullYear()}`,
                                      month: `${
                                          modifiedTime.getMonth() + 1
                                      }`.padStart(2, '0'),
                                      day: `${modifiedTime.getDate()}`.padStart(
                                          2,
                                          '0'
                                      ),
                                  }
                                : null,
                            error: error.message,
                        });
                    }

                    let date: FileDate | null = null;
                    try {
                        const originalDate =
                            data?.exif?.DateTimeOriginal ??
                            data?.exif?.CreateDate;
                        if (originalDate) {
                            const splitDate = originalDate.split(':');

                            date = {
                                year: `${parseInt(splitDate[0])}`,
                                month: `${parseInt(splitDate[1])}`.padStart(
                                    2,
                                    '0'
                                ),
                                day: `${parseInt(splitDate[2])}`.padStart(
                                    2,
                                    '0'
                                ),
                            };
                        }
                    } catch (err) {
                        return resolve({
                            path: file.path,
                            name: file.name,
                            date: null,
                            error: `Unable to parse date, ${err}`,
                        });
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
                !file.error &&
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

    private writeImportData(outputTasks: OutputTasks): string {
        if (!fs.existsSync(`${this.config.outputPath}`)) {
            fs.mkdirSync(`${this.config.outputPath}`);
        }

        const importDataFileName = `${
            this.config.outputPath
        }/import-${getTimeForFileName()}.json`;

        fs.writeFileSync(
            importDataFileName,
            JSON.stringify(outputTasks, undefined, 4)
        );

        return importDataFileName;
    }
}

export { Importer };
