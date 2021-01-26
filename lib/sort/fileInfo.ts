export interface FileDate {
    year?: string;
    month?: string;
    day?: string;
}

export interface FileInfo {
    path: string;
    name: string;
    date: FileDate | null;
    error?: string | null;
}

export interface FilePath {
    path: string;
    name: string;
}
