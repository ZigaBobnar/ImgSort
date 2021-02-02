import { SortConfig } from './sort/sortConfig';
import { FileDate } from './sort/fileInfo';

const getTimeForFileName = (date: Date | null = null): string => {
    if (!date) {
        date = new Date(Date.now());
    }

    return date.toISOString().replace(/:/g, '.').slice(0, 19);
};

const formatOutputFolderName = (
    config: SortConfig,
    date: FileDate
): string | null => {
    if (!date.year || !date.month || !date.day) {
        return null;
    }

    const formatted = config.outputFolderStructure
        .replace(getRegExp('YYYY'), date.year)
        .replace(getRegExp('MM'), date.month)
        .replace(getRegExp('DD'), date.day);

    return formatted;
};

const getRegExp = (find: string) => {
    return new RegExp(find, 'g');
};

export { getTimeForFileName, formatOutputFolderName };
