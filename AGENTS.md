# AGENTS.md — 给 AI 代理的仓库指南

## 项目是什么

`dsh-chatgpt-subscription` 是 DeepSeek Harness (DSH) 的静态 bundle 插件：用官方 OAuth 绑定 ChatGPT 账号，在 DSH 内使用 ChatGPT 模型对话。

## 结构

- `src/host.js` — host 半：OAuth 绑定状态机（PKCE/state/回调/令牌交换/写回/绑定标记）、令牌看护（30min 周期 + JWT 过期判定 + 续期 + 凭据注入）、openai-codex 路由注册（displayName=ChatGPT, transport=sse）、RPC（`/_dsh/dsh-chatgpt-subscription/{getCodexBridgeStatus,startCodexOAuth,unbindCodex}`，修改类同源防护）
- `src/client-bundle.js` — client 半：插件详情页「ChatGPT 订阅」配置（`plugins.bundle.config`，key=`dsh-chatgpt-subscription`）
- `scripts/build.mjs` — 构建（src/ → lib/；client 包装为 `window.__ModuleLoader__.load({ id: "dsh-chatgpt-subscription", ... })`）
- `tests/` — `run-all.mjs` 入口 + `test-codex-host.js`（36 断言，零真实网络/零真实 auth.json）+ `test-install-docs.mjs`（安装方式契约）
- `cordis.patch.yml` — bundle 挂载行（`name` 必须是包名 `dsh-chatgpt-subscription`；`id` 是用户覆盖用的行键，取短名 `chatgpt-subscription`，**不得与 name 相同**——相同的话插件卡片的「行 id / 模块名」两行会是同一串字）
- `lib/` — 构建产物，**已提交**（支持直接 `dsh plugin add` / 插件页填 GitHub 地址，勿从 git 移除）
- `README.md` / `README.zh-CN.md` / `docs/INSTALL.md` — 用户安装入口文档，三条路径必须始终与 DSH 实际能力一致（见「安装方式」）
- `install.sh` / `uninstall.sh` — 一键安装/卸载（默认 web profile；desktop profile 会被这两支脚本明确拒绝并引导到客户端插件页）

## 关键约束（不可违背）

1. **插件 id / client 模块 id 一律 `dsh-chatgpt-subscription`**，禁止出现 `dsh-bottom-info-bar`（复制底稿残留会破坏挂载）
2. **env 前缀一律 `DSH_CHATGPT_*`**（AUTH / DATA_DIR / BIND_FILE / OAUTH_PORT / OAUTH_TIMEOUT_MS），测试隔离用
3. **令牌铁律**：token 只存 `~/.codex/auth.json`（0600）与 DSH 凭据库；不打印、不进日志、不进错误信息、不进 git 历史；错误信息不得含 token 片段
4. **绑定标记（codex-bind.json）是绑定唯一事实**：只有官方 OAuth 授权成功才写标记；codex CLI 登录态绝不自动使用
5. **解绑/卸载绝不删除 `~/.codex/auth.json`**（codex CLI 自己的登录态）
6. 静态 bundle 勿改回动态插件；`lib/` 由 `npm run build` 生成
7. 零密钥、零个人路径；author=SONGOAO25
8. OAuth 回调端口生产必须 1455（redirect_uri 与 OpenAI 注册值一致）

## 安装方式（用户入口，2026-09-24 随桌面端客户端发布适配）

用户装插件只有 DSH 提供的三条路，文档、脚本、清单必须同时支持；改任何一条都要同步三处文档 + `test-install-docs.mjs`：

1. **插件页「添加插件」**（桌面端客户端唯一入口）——「包名或地址」框支持包名 / GitHub 仓库地址 / 本地目录绝对路径，但**本仓库只用后两者**（不发布 npm）。**仓库根必须就是插件包**（`package.json` + `cordis.patch.yml` 在根），且 `lib/` 已入库：这样填仓库地址零构建、零授权即可安装。
2. **命令行** `dsh plugin --profile <name> add <包名|地址|目录>`——只对 CLI 自建 profile 有效（`dsh web` → `web`）。
3. **一键脚本**（产生 `link:` 安装）——跟随工作副本，不是仓库默认分支的版本。

硬约束：

- **桌面端客户端不能用命令行**：DSH 的 `desktop` profile 由 Electron 应用独占管理，`dsh plugin --profile desktop ...` 会被 CLI 直接拒绝。文档与脚本一律引导用户到客户端 **插件 → 添加插件**。
- **`package.json` 只允许 `prepublishOnly`**（本仓库不发 npm，它只是有人手动发布时的重建保险）。**禁止加 `prepare` / `prepack` / `postinstall`**：pnpm 对 git 依赖会执行 `prepare` 并在未放行时直接失败（`ERR_PNPM_GIT_DEP_PREPARE_NOT_ALLOWED`），会让「填 GitHub 地址」这条主流安装路径变成「待批准的构建脚本」卡点（已实测：带 `prepare` 的清单装 git 地址 exit=1，只留 `prepublishOnly` 则 exit=0 且零构建）。
- **本仓库不发布 npm 包**（2026-09-24 决定）：`publish-npm.yml` 已删除，不要加回来；三处文档一律引导填**仓库地址**，禁止出现包名安装/更新指引（不带地址的 `dsh plugin … add dsh-chatgpt-subscription`、`@latest` 之类），故障排查要写明「报未找到相关插件 → 改填仓库地址」。`test-install-docs.mjs` 会拦住回退。
- 改 `src/` 后必须 `npm run build` 并提交 `lib/`（CI 的「Verify generated bundle is committed」会拦住忘记重建的 PR）。

## 开发流程

1. 改 `src/` → `npm run build` 重建 `lib/`（`lib/` 入库，必须一起提交）
2. `node tests/run-all.mjs` 必须全绿
3. 提交信息遵循 Conventional Commits
4. 发布四件套同步：semver → CHANGELOG → commit → tag → Release；本仓库不发布 npm 包，tag/Release 只作版本记录与安装地址（`…/dsh-chatgpt-subscription`）的刷新节点

### 发布链的两个已知空档（2026-09-24 补）

- **auto-merge 的合并不会触发 push 事件**：仓库自带的 auto-merge 用 `GITHUB_TOKEN` 推送，GitHub 有意不让它触发其他 workflow。于是合并到 main 后 **Release Please / CI 都不会自动跑**，发布 PR 会停在旧状态。补跑方式：
  ```bash
  gh workflow run release-please.yml            # 刷新发布 PR（含最新 commit 与 CHANGELOG）
  ```
- **发布 PR 的必需检查 `CI` 不能用 workflow_dispatch 顶替**（2026-09-24 实测）：release-please 用 `GITHUB_TOKEN` 推分支，它触发的 `pull_request` 运行会停在 `action_required`（同仓 bot 分支的 approve API 返回 404，批不了）。`gh workflow run CI --ref <发布分支>` **确实能把 CI 跑绿**，但那次运行不挂在 PR 上，PR 依旧 `BLOCKED`（`gh pr checks` 显示 no checks）。可靠做法是让 owner 重新触发 `pull_request`：
  ```bash
  gh pr close <发布PR> && gh pr reopen <发布PR>   # 以 owner 身份重跑 CI/CodeQL，PR 转 CLEAN
  ```
  刷新（上一条）之后分支被 bot 重新推送，需要再执行一次 close/reopen。
