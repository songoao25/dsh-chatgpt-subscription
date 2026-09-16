# AGENTS.md — 给 AI 代理的仓库指南

## 项目是什么

`dsh-chatgpt-subscription` 是 DeepSeek Harness (DSH) 的静态 bundle 插件：用官方 OAuth 绑定 ChatGPT 账号，在 DSH 内使用 ChatGPT 模型对话。

## 结构

- `src/host.js` — host 半：OAuth 绑定状态机（PKCE/state/回调/令牌交换/写回/绑定标记）、令牌看护（30min 周期 + JWT 过期判定 + 续期 + 凭据注入）、openai-codex 路由注册（displayName=ChatGPT, transport=sse）、RPC（`/_dsh/dsh-chatgpt-subscription/{getCodexBridgeStatus,startCodexOAuth,unbindCodex}`，修改类同源防护）
- `src/client-bundle.js` — client 半：设置侧边栏「订阅」页（settings.section, id=`chatgpt-subscription`, order=25）
- `scripts/build.mjs` — 构建（src/ → lib/；client 包装为 `window.__ModuleLoader__.load({ id: "dsh-chatgpt-subscription", ... })`）
- `tests/` — `run-all.mjs` 入口 + `test-codex-host.js`（36 断言，零真实网络/零真实 auth.json）
- `cordis.patch.yml` — bundle 挂载行（id 必须为 `dsh-chatgpt-subscription`）
- `lib/` — 构建产物，**已提交**（支持直接 `dsh plugin add`，勿从 git 移除）

## 关键约束（不可违背）

1. **插件 id / client 模块 id 一律 `dsh-chatgpt-subscription`**，禁止出现 `dsh-bottom-info-bar`（复制底稿残留会破坏挂载）
2. **env 前缀一律 `DSH_CHATGPT_*`**（AUTH / DATA_DIR / BIND_FILE / OAUTH_PORT / OAUTH_TIMEOUT_MS），测试隔离用
3. **令牌铁律**：token 只存 `~/.codex/auth.json`（0600）与 DSH 凭据库；不打印、不进日志、不进错误信息、不进 git 历史；错误信息不得含 token 片段
4. **绑定标记（codex-bind.json）是绑定唯一事实**：只有官方 OAuth 授权成功才写标记；codex CLI 登录态绝不自动使用
5. **解绑/卸载绝不删除 `~/.codex/auth.json`**（codex CLI 自己的登录态）
6. 静态 bundle 勿改回动态插件；`lib/` 由 `npm run build` 生成
7. 零密钥、零个人路径；author=SONGOAO25
8. OAuth 回调端口生产必须 1455（redirect_uri 与 OpenAI 注册值一致）

## 开发流程

1. 改 `src/` → `npm run build` 重建 `lib/`
2. `node tests/run-all.mjs` 必须全绿
3. 提交信息遵循 Conventional Commits
4. 发布四件套同步：semver → CHANGELOG → commit → tag → Release
