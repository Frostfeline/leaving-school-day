# 《离校日》

基于 NF 桌角色的网页解谜、文字推理与视觉小说作品。纯静态前端，使用 TypeScript、Vite 与 Hash 路由；玩家进度保存在当前浏览器本地。

## 本地运行

使用 Node.js 22.18 或更新的 22.x 与 npm。

```sh
npm ci
npm run dev
```

本机仍可使用原来的“启动离校日.cmd”。不要直接双击 index.html 游玩。

## 测试和构建

```sh
npm test
npm run test:release
npm run build
npx --no-install playwright install chromium
npm run test:pages
```

正式网站为 dist。生产验收使用隔离浏览器和临时静态服务，模拟仓库子路径；Windows 默认使用 Edge，也可设置 BROWSER_EXECUTABLE。测试不会使用日常浏览器的玩家存档。

## 发布与维护

- [首次公开仓库文件清单](docs/PUBLISH-FILES.md)
- [首次发布与线上更新指南](docs/ONLINE-UPDATE.md)
- [本次准备验收报告](docs/RELEASE-REPORT.md)

本地配置准备不等于公网发布完成。实际创建公开仓库、上传与 GitHub Pages 授权需由作者确认。

源码公开会包含解谜答案与剧情，请避免在游玩前阅读内容文件。剧情、美术及第三方素材的权利归各自权利人；公开仓库不自动授予再使用许可。字体与 PDF.js 的原许可证保留在 public 中。
