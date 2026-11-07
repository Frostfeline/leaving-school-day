import meta from '../content/memoryArchive/archive-meta.json';
import accountData from '../content/bookstore/accounts.json';
export const storyDates=meta.dates;
export const bookstoreAccounts={accounts:accountData.accounts.map(a=>({...a,password:storyDates[a.passwordDateRef as keyof typeof storyDates].replaceAll('-','')}))};
