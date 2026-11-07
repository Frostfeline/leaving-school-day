# 《离校日》线上更新指南

本地修改 → 测试 → 构建 → 审阅并提交指定文件 → 推送默认分支 → Actions 自动更新原网址。

## 首次发布，由作者操作

1. 在 GitHub 登录自己的账号，选择 New repository。仓库名建议 `leaving-school-day`，简单英文和短横线即可；项目仓库不必叫 `用户名.github.io`。选择 Public，不勾选初始化 README、.gitignore 或许可证，创建空仓库。
2. 回本地检查 `git status`、`git branch --show-current`、`git remote -v`。准备时当前分支是 `master`、无远程。确认 Git 提交身份使用自己愿意公开的名称和邮箱，可使用 GitHub 的 noreply 邮箱。
3. 审阅 `docs/PUBLISH-FILES.md`，使用明确目录暂存，避免 `git add .`。以下命令由作者确认上传范围后执行，本次 Codex 没有执行。

```powershell
git add -- .gitignore .github README.md docs index.html package.json package-lock.json tsconfig.json vite.config.ts src public scripts 启动离校日.cmd
git diff --cached --name-only
git diff --cached --stat
git diff --cached --check
git commit -m "Prepare Leaving School Day for GitHub Pages"
git remote add origin https://github.com/你的用户名/你的仓库名.git
git push -u origin master
```

若当前分支以后不再是 master，使用真实分支名；若 origin 已存在，不重复添加、不覆盖其地址。如果远程已有提交，不强制推送，交给 Codex 先检查差异。只推送所选分支，不推送 `--mirror`、`--all` 或本地工具的检查点引用。通过 Git 的账号登录窗口授权，不把令牌写入地址或文件。

4. GitHub 仓库 Settings → Pages → Build and deployment → Source，选择 **GitHub Actions**。首次推送可能早于此设置并导致部署失败，设置后在 Actions 中重新运行即可。
5. 核对仓库默认分支就是刚推送的分支。作者已确认使用 `master`。工作流明确监听 master，并限制手动运行也只能发布 master，不依赖空仓库首次推送事件中的默认分支字段。以后若决定换发布分支，需同时修改工作流，并检查 Pages 的 `github-pages` environment 是否允许新分支。
6. 在 Actions → Publish GitHub Pages 中查看 `build` 和 `deploy` 都变绿。失败时打开红色步骤查看错误，不跳过测试。手动重跑用 Run workflow，选择默认分支。
7. Settings → Pages 的 Visit site 或成功部署任务提供正式网址，通常为 `https://用户名.github.io/仓库名/`。用这个链接先自行验证，再分享给 10—30 位朋友。首次上线至少试开 PDF、微信聊天、OA 与一条完整结局；找一位大陆朋友和一部手机实际测试。

以上建仓、Public 设置、登录授权、Pages 来源与首次上传仍待作者完成。Codex 只准备了本地配置与验收，没有创建仓库或公网网站。

## 以后更新

在项目文件夹让 Codex 修改需要的内容，再执行以下流程。正式构建前先关闭正在使用本项目的旧本地预览，避免 Windows 上的构建工具占用。

```powershell
npm ci
npm test
npm run test:release
npm run build
npx --no-install playwright install chromium
npm run test:pages
git status --short
```

本机如果只有 Codex 自带 Node 而没有 npm，可将 `npm` 换成 `node .tools/package/bin/npm-cli.js`。这是本机已有工具，不上传 `.tools`。正常安装 Node.js 22.18 或更新的 22.x 的电脑直接用 npm。Windows 验收默认使用 Edge，也可设置 `BROWSER_EXECUTABLE`；Linux CI 使用 Playwright Chromium，工作流自动安装浏览器依赖。

确认通过后，仅暂存本次需要的具体文件，查看 diff，再 commit、push。可对 Codex 说“本次修改已确认，请检查待提交文件并提交、推送到现有仓库”。若只是要求本地修改，Codex 不应把它理解为已授权公开上传。

Actions 会在干净的 Ubuntu 环境重新 `npm ci`、测试、构建、生产浏览器验收，通过后才发布新 dist；不上传本地旧 dist。工作流限制同一时间一项部署，不中断正在进行的部署。

## 常见问题

| 修改或情况 | 处理 |
| --- | --- |
| 文本、剧情 JSON | 需要重新构建并推送 |
| 图片、PDF、字体 | 需要重新构建并推送 |
| CSS、页面布局或代码 | 需要重新构建并推送 |
| 每次更新是否重新发网址、邀请玩家 | 不需要，仓库与 Pages 地址保持不变即可 |
| 更新后旧进度 | 同一网址、同一浏览器资料、存储键和结构兼容时通常保留 |
| 本地试玩存档转到 GitHub | 不会自动迁移，不同 origin 是独立存储 |
| 换设备、换浏览器、无痕窗口 | 不会自动同步，不是云存档 |
| 清除网站数据或浏览器限制存储 | 可能丢失进度 |
| 新版本看起来没变 | 先核对对应 commit 的 deploy 已成功，再正常刷新；不要清除网站数据来更新 |

同一 `用户名.github.io` 的不同项目路径属于同一 origin。本游戏使用固定 localStorage 键，因此不要在同一账号的其他项目路径同时放需要独立存档的第二份本游戏。此轮没有修改键或迁移进度。

PDF 已按现有方式测试，但旧浏览器或微信内置浏览器仍可能不兼容，目前预览失败没有“直接打开原 PDF”的界面后备入口。未来添加音乐后需再测试首次用户点击后的播放；当前没有实际音频文件。大陆访问速度需要朋友实网测试，工作流无法保证当地网络质量。

官方依据：[GitHub Pages 自定义工作流](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)。
