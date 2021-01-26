const getTimeForFileName = (): string => {
    return new Date().toISOString().replace(/:/g, '.').slice(0, 19);
};

export { getTimeForFileName };
