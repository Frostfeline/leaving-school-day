import presentation from '../content/wechat/presentation.json';
import dialogue from '../content/wechat/dialogues/sister-confrontation-3.json';
import ui from '../content/wechat/dialogues/sister-confrontation-ui.json';
import attachments from '../content/wechat/attachments/sister-manuscript.json';
import reading from '../content/bookstore/mail-reading.json';
export const confrontationBundle={dialogue:{...dialogue,messageIntervalMs:presentation.newMessageIntervalMs},attachments,reading,ui};
export type ConfrontationBundle=typeof confrontationBundle;
export interface ConfrontationProgress {manualMessageId?:string|null;waitingMessageId?:string|null;nodeId:string|null;emitted:{id:string;nodeId:string;at:number}[];selectedOptions:Record<string,string>;visitedNodes:string[];startedAt:number|null;completedAt:number|null;nextAt:number|null;eligibleAt:number|null;manuscriptViewedAt:number|null;readIncomingIds:string[]}
