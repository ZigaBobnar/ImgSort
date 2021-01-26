export interface FileDate {
    year?: number;
    month?: number;
    day?: number;
}

export interface FileInfo {
    path: string;
    name: string;
    date: FileDate | null;
}

export interface FilePath {
    path: string;
    name: string;
}
