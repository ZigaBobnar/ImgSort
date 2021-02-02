export type MoveTask = {
    moveType: 'mv' | 'cp' | 'cpRm';
    old: string;
    new: string;
};
