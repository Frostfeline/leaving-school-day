import ui from '../content/memoryArchive/ui.json';
import chats from '../content/memoryArchive/chats.json';
import attachments from '../content/memoryArchive/attachments.json';
import puzzle from '../content/memoryArchive/puzzle.json';
import meta from '../content/memoryArchive/archive-meta.json';
export const archiveBundle={ui,chats,attachments,puzzle,'archive-meta':meta};
export type ArchiveBundle=typeof archiveBundle;
export type ArchiveProgress={progressVersion:number;timelineSlots:(string|null)[];attachmentSlots:(string|null)[];orderedCount:number;matchedCount:number;archivePuzzleCompleted:boolean;visitedArchive:boolean;lastOpenedArchiveTab:string;lastViewedConversationId:string|null};
