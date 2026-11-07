import {el} from '../utils/dom';
/** Reserve the same space for sending, choices and automatic replies. */
export function stableChatFooter(reader:HTMLElement,scroll:HTMLElement){const footer=el('div','bs-stable-chat-footer');while(scroll.nextSibling)footer.append(scroll.nextSibling);reader.append(footer);}
