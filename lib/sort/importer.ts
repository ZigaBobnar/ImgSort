import fs from 'fs';
import { SortConfig } from './sortConfig';
import { FileDate, FileInfo } from './fileInfo';
import { FileMoveTask, OutputTasks } from './tasks';
import { ExifImage } from 'exif';
import { FilePath } from './fileInfo';
import { formatOutputFolderName, getTimeForFileName } from '../utils';
import { ImporterInterface } from './interfaces';

class Importer implements ImporterInterface {
    constructor(public readonly config: SortConfig) {}

    async import(): Promise<string> {
        const files = await this.findFiles(this.config.ingestPath);

        console.log(`Found ${files.length} files`);

        const fileInfos = await this.getFileInfos(files);
        const outputTasks = await this.prepareOutputTasks(fileInfos);
        const outputTasksFile = await this.writeImportData(outputTasks);

        return outputTasksFile;
    }

    async findFiles(path: string): Promise<FilePath[]> {
        console.log(`Searching in ${path}`);

        const files = fs.readdirSync(path, {
            withFileTypes: true,
        });

        let outFiles: FilePath[] = [];

        for (const file of files) {
            if (file.isDirectory()) {
                const subFiles = await this.findFiles(path + '/' + file.name);
                outFiles = [...outFiles, ...subFiles];
            } else if (file.isFile()) {
                outFiles.push({ path, name: file.name });
            } else {
                console.log(`Unknown file type - ${file.name}`);
            }
        }

        return outFiles;
    }

    async getFileInfos(files: FilePath[]): Promise<FileInfo[]> {
        const fileInfos: FileInfo[] = [];
        let i = 1;
        const step = Math.max(4, Math.ceil(files.length / 20));
        let target = step;

        for (const file of files) {
            if (i > target) {
                target += step;
                console.log(`Processed ${i}/${files.length} files`);
            }

            fileInfos.push(await this.getFileInfo(file));

            i++;
        }

        return fileInfos;
    }

    async getFileInfo(file: FilePath): Promise<FileInfo> {
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

    async prepareOutputTasks(files: FileInfo[]): Promise<OutputTasks> {
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
                const outputDir = `${
                    this.config.outputPath
                }/${formatOutputFolderName(this.config, file.date)}`;

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

    async writeImportData(outputTasks: OutputTasks): Promise<string> {
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
