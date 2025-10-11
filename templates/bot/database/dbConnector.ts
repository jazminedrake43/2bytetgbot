import { Database } from 'bun:sqlite';

export default () => {
    return new Database(import.meta.dirname + '/database.sqlite');
}