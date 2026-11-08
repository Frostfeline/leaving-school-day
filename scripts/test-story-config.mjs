import {readFileSync} from 'node:fs';
export const storyDates=JSON.parse(readFileSync('src/content/memoryArchive/archive-meta.json','utf8')).dates;
export const testBookstoreAccount=JSON.parse(readFileSync('src/content/bookstore/accounts.json','utf8')).accounts[0];
