export function el<K extends keyof HTMLElementTagNameMap>(tag: K, className = '', text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) setText(node, text);
  return node;
}

/** Safe, shared emphasis rendering; source strings remain untouched. */
export function setText(node: HTMLElement, text: string) {
  node.replaceChildren();
  const emphasis = /(\*\*?)([^*]+?)\1/g;
  let start = 0;
  for (const match of text.matchAll(emphasis)) {
    node.append(document.createTextNode(text.slice(start, match.index)));
    const strong = document.createElement('strong'); strong.textContent = match[2]; node.append(strong);
    start = match.index! + match[0].length;
  }
  node.append(document.createTextNode(text.slice(start)));
}
export function plainText(text: string) { return text.replace(/(\*\*?)([^*]+?)\1/g, '$2'); }
