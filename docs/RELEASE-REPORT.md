# 《离校日》GitHub Pages 发布准备验收

检查日期按作者时区为 2026-11-07。此报告描述本地工程准备；没有创建远程仓库、上传、提交、推送或发布网站。

## A. 实际修改文件

| 文件 | 改动 |
| --- | --- |
| `.gitignore` | 忽略内部输出、旧说明、环境配置、缓存、日志和临时文件；不删除本地文件 |
| `.github/workflows/pages.yml` | 默认分支自动及手动触发；Node 22；安装、测试、构建、生产验收、官方 Pages artifact 与部署 |
| `package.json` | 增加 `test:release`、`test:pages`，不更换依赖 |
| `scripts/pages-check.mjs` | 新增严格静态服务器与仓库子路径生产验收，不使用 Vite 或页面重写 |
| `scripts/memory-archive-check.mjs` | 增加测试网址和浏览器路径参数，支持 Linux CI |
| `scripts/sister-confrontation-browser-check.mjs` | 同上；按当前 UI 点击历史联系人、发送林琛消息、选择有效选项；按当前 JSON 核对消息 ID |
| `scripts/final-story-browser-check.mjs` | 同上；生产模式执行四结局及 CAST，开发编辑器写盘及两项源码函数探针保留在开发模式 |
| `README.md` | 新的公开项目说明；旧版本已完整备份到忽略目录 `.tools/release/README.before.md` |
| `docs/PUBLISH-FILES.md` | 首次公开范围、特殊文件说明 |
| `docs/ONLINE-UPDATE.md` | 首次发布及后续更新操作指南 |
| `docs/RELEASE-REPORT.md` | 本报告 |

另外重新生成了忽略目录 `dist/`，测试输出位于 `test-results/`，本地工具与原文件哈希基线位于 `.tools/release/`。为匹配 Node 22，在 `.tools/release-node-bin/` 准备了本地运行时，不加入正式项目依赖。

未修改 `src/`、`public/`、`vite.config.ts`、`tsconfig.json`、`index.html`、`package-lock.json`。源码和素材逐文件哈希复核，保证本轮不改剧情、图片、布局、动画、存档、Flag 或分支。

## B. 项目公开范围

公开 `src/`、`public/`、`scripts/`、`.github/`、`docs/`、正式入口、配置、依赖清单与新 README。旧维护 README、内部历史文档及所有指定本地输出均已忽略，详细列表见 [首次公开仓库文件清单](PUBLISH-FILES.md)。

准备时实际分支是 `master`，没有远程，Git 索引为空。无需取消跟踪，未动暂存区。首次上传应使用指南的明确路径清单；不要上传整个文件夹、不要强制推送、不要镜像推送工具引用。

对候选文本做了常见 API 令牌、私钥、个人 Windows 用户路径扫描，没有发现匹配。开发插件使用运行时随机令牌并限制回环访问；仅存在于开发服务。游戏虚构账号、解谜密码、答案和结局文件按要求保留。图片公开资格沿用作者确认，没有做图片隐私复核。

## C. 自动化测试

实际安装使用现有 npm 11.6.2 工具。环境默认 Node 为 24.22.1，初次构建通过后，又以 Node 22.23.4 完整执行安装、内容检查、模型测试与构建。以下 `npm` 在本机实际等效命令是 `node .tools/package/bin/npm-cli.js`；CI 使用标准 npm。

| 命令或检查 | 结果 |
| --- | --- |
| `npm ci --cache .tools/npm-cache --no-fund --no-audit` | Node 22 下成功安装锁定依赖；锁文件未改变 |
| `npm test` | 通过；全部现有内容校验及非法输入反例 |
| `npm run test:release` | 通过；书店数据、姐姐对质全部 12 种有效组合、Hermitage 模型、私人委托三分支及历史存档兼容 |
| `npm run build` | 通过；TypeScript 检查与 Vite 7.3.7 生产构建 |
| `npm run test:pages` 对应的 `node scripts/pages-check.mjs` | 通过；子路径静态资源、页面、PDF、存档、回忆留声、对质及四结局 |
| 工作流 YAML 解析与关键字段断言 | 通过；使用已安装 Playwright 内的 YAML 解析器，未安装新解析依赖 |

生产测试内容包括全部发布文件逐个 HTTP 加载、素材字节一致性、大小写精确路径和源码相对导入检查；15 个页面路由及刷新、前进后退；真实 OA 验证码登录和微信跨标签页共享；PDF.js 模块、worker、中文文字层、缩放及关闭；旧书网字体；生产环境编辑器不可用；关闭并重启隔离浏览器后的进度；回忆留声全部关联与拖拽互换；手机尺寸及触屏选择替代拖拽；宁先生阅读判定、姐姐第三次对质和残页门槛；委托核验、四种结局、回溯、片尾与后记。

测试失败及处理记录没有跳过：初次 `npm ci` 被本项目旧预览服务占用的 esbuild 阻止，确认进程来源后停止服务并重装成功；Node 22 的通用 npm 安装包依赖系统 npm 命令失败，改为下载对应 Windows 运行时包，未影响项目依赖。新增生产测试调试时修正了页面等待、字体所在页面、触屏按钮定位。旧姐姐浏览器脚本引用早期自动进入通信、自动发送、停用选项和固定 32 条记录的假设，均按现有界面行为修订，没有修改游戏来迎合测试。Python 不含 YAML 模块，因此使用现有 Playwright 自带解析器验证配置。

浏览器测试使用独立资料目录与临时本地 origin，剧情门槛测试会在该隔离环境设置指定前置状态，不写作者日常浏览器的存档。模型验证覆盖所有有效对质组合，浏览器实走其中一条对质路径以及四种结局，并非穷举一切 UI 操作序列。旧开发编辑器、早期页面原型脚本没有全部运行；工作流运行的是当前 `npm test`、四项模型测试和生产验收套件。

## D. 构建结果

最新 `dist/index.html` 已重新生成。共 **76 个文件，49,231,410 字节（49.23 MB / 46.95 MiB）**。

| 类型 | 数量 | 字节 |
| --- | ---: | ---: |
| PNG | 16 | 35,127,872 |
| JPG | 11 | 8,435,135 |
| JPEG | 15 | 1,963,204 |
| WebP | 1 | 59,158 |
| SVG | 24 | 10,545 |
| PDF | 1 | 43,343 |
| WOFF2 字体 | 1 | 2,184 |
| PDF.js 模块与 worker | 2 | 3,090,531 |
| 游戏 JS | 1 | 357,835 |
| 游戏 CSS | 1 | 126,414 |
| HTML | 1 | 618 |
| 字体、PDF.js 许可证 | 2 | 14,571 |
| 音频 | 0 | 0 |

图片合计 67 张、45,595,914 字节。最大的单文件是 `assets/images/bookstore/daojiao-interior.png`，3,389,563 字节。没有发现字节完全相同的重复素材。`public/` 的 73 个文件原样进入构建，未夹入 output、outputs、脚本、测试目录、源码映射或开发服务。

仍有旧占位 SVG 和 `assets/images/oa/donglan-emblem-original.png`（1,837,250 字节）等没有查到运行时代码中的直接引用。这些早已存在于 public，并非本次意外新增；按作者要求全部保留，不删素材。许可文本没有页面引用是正常情况。

`base: './'` 保持。源 CSS 的字体 URL 虽写 `/assets/...`，Vite 已产出 `../assets/fonts/...`，在仓库子路径下验证，不需要改源 CSS。Hash 路由无需 SPA 重写。PDF 和 worker 都走子路径下的本地资源。正式应用包没有 localhost、Windows 用户路径或开发写盘接口。源码中的 W3C SVG namespace 字符串不是第三方请求；依赖锁文件的 npm registry 地址仅用于构建。

## E. GitHub Pages 准备状态

工作流已准备。按照 [GitHub 官方自定义工作流](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages) 使用 configure-pages、upload-pages-artifact 和 deploy-pages；安装环境使用官方 [setup-node](https://github.com/actions/setup-node)。build 只有 contents 读取权限，deploy 才获取 pages 和 id-token 写入权限；仅上传最新 dist。

首次上传补充：作者已创建空仓库 Frostfeline/leaving-school-day，并确定使用 master。工作流已改为明确监听 master，手动执行也仅允许 refs/heads/master，避免首次推送时默认分支元数据造成跳过。本地分支未改名，未修改账号全局偏好。并发部署不互相中断。

GitHub 界面设置、真实 Linux runner 执行、Pages 授权与最终公网网址仍待首次发布。没有把本地通过称作公网成功。

## F. 风险与限制

- 未实测中国大陆实际网络速度或 GitHub Pages 可达性；10—30 位朋友应先小范围试开。
- 本地浏览器为 Windows Edge。手机尺寸和触屏点击经过模拟，未实测真机、iOS Safari、Firefox、Android 或微信内置浏览器；原生 HTML 拖拽在触屏上的体验不能由桌面模拟保证，已有点选替代路径。
- PDF 本地 Edge 已实测。旧内核可能不支持当前 PDF.js；预览失败目前没有直接打开原 PDF 的备用按钮，按要求不改 UI。
- 当前无音频素材。未来添加音乐必须再验证用户首次点击、后台标签和移动端自动播放限制。
- 主要存档键仍是 `leaving-school-day:state:v1`；刷新、关闭重开、同一网址更新通常保留。更换设备、浏览器、origin 或清除网站数据不会同步。浏览器隐私和存储限制仍可能导致无法持久化。
- 同一账号的 github.io 不同项目路径共享 origin；不要同时放需要独立进度的第二份同游戏。此轮没有更改存档命名或增加云存档。
- 静态前端答案与未触发剧情可被阅读，属于单机解谜的正常边界，不是需要增加后端的泄露漏洞。
- 真实 Pages 构建、第三方下载和 GitHub 服务状态需要首次 Actions 运行确认。今后工作流失败不会发布失败的构建；应查看失败步骤处理，不跳过测试。

## G. 作者下一步

1. 创建空的 Public 仓库，例如 `leaving-school-day`。
2. 确认公开文件和提交身份，按 [更新指南](ONLINE-UPDATE.md) 明确暂存文件、提交并推送。
3. Settings → Pages 选择 GitHub Actions，确认默认分支与推送分支一致。
4. 等待 build 和 deploy 成功，必要时在设置完成后手动重跑。
5. 用 Pages 提供的网址先自测，再发朋友。以后更新原网址即可。

## 最终验收记录

生产全流程验收已通过，未解决失败项为零。15 项常规路由刷新、历史导航、触屏点选、PDF 预览、关浏览器再开存档、回忆留声全配对、姐姐对质、私人委托 A/B/C 及 Normal End 均成功，Good/Bad/True 文本、结局收藏、回溯、CAST 与后记由现有最终剧情浏览器脚本逐项断言。

机器结果位于本地 `test-results/pages-report.json`，包含资源分类、最大文件、重复检查、候选未引用资源与浏览器请求记录；此目录不公开。当前构建适合进入作者创建仓库并授权发布的步骤；公网发布本身仍未执行。
