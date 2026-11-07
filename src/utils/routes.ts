export const routes = { 'memory-archive':'#/memory-archive', 'oa-login': '#/oa/login', 'bookstore-home':'#/bookstore','fortune-match':'#/fortune-match','wechat-article-borrow-life':'#/wechat/article/borrow-life','fiction-changdu':'#/fiction/changdu' } as const;
export function routeUrl(id: keyof typeof routes) { return new URL(routes[id], location.href).href; }
