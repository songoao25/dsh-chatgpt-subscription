# 工程审计报告：ChatGPT 订阅插件与模型线路隔离（初版）

日期：2026-08-20
执行方式：主 Agent 源码审计 + 两个独立只读审计 Agent；未读取或记录真实密钥。

> **状态注记（2026-08-20 后）**：本报告描述的是「插件管理搜索线路」时期的发现。用户已决定**彻底移除插件对搜索配置的管理**（搜索商由用户在 DSH 配置层自行指定），P0-1 的修复方向已被此决策完全超越；下文历史内容仅作档案留档，不代表当前代码行为。

## 已确认问题

| 编号 | 问题 | 严重度 | 证据 | 修复方向 |
|---|---|---:|---|---|
| P0-1 | Web 搜索固定使用 `deepseek-official`，不跟随聊天模型 | 严重 | DSH dsh-base cordis.patch.yml 的 web/searchProvider；dsh-web-search-deepseek provider | ChatGPT 绑定不再暗中触发 DeepSeek；无兼容搜索服务时明确不可用 |
| P0-2 | 插件只注册 `openai-codex`，不保证当前/默认会话真的切换到它 | 严重 | src/host.js ensureCodexRoute 仅修改 llm-pi-ai | 绑定后安全设置默认路由；记录并尊重用户后续手动选择 |
| P1-1 | 解绑/绑定失效时可能遗留 `OPENAI_CODEX_API_KEY` | 高 | src/host.js syncCodexTokenOnce 的 unbound/no-login/no-key 分支未清凭据 | 状态失效时清理插件注入凭据，避免旧令牌继续使用 |
| P1-2 | 解绑后路由仍留在模型列表，造成“已解绑但仍可选” | 高 | src/host.js unbindCodexRpc 只清标记和凭据 | 解绑时移除插件拥有的路由；绑定时重建 |
| P1-3 | 令牌文件写入未显式修正已有文件权限 | 高 | writeAuthJson/writeBindFlag/clearCodexAuthTokens | 写入后 chmod 0600，保留原子替换 |
| P1-4 | 同步任务没有明确互斥，OAuth/周期同步可能竞态写 auth 与凭据 | 中 | syncCodexToken / ctx.interval / OAuth flow | 增加单飞锁和安全状态收敛 |
| P2-1 | 当前默认模型、绑定状态、实际请求线路缺少可见校验 | 中 | 设置页仅显示绑定与过期时间 | 状态页显示线路状态与搜索隔离说明，避免用户误以为全局切换 |
| P2-2 | 测试只覆盖纯函数，缺少路由、失效清理、默认模型和安全回归 | 中 | tests/run-all.mjs 仅运行 test-codex-host.js | 增加静态配置/行为回归测试，禁止真实网络与真实凭据 |

## 安全边界

- 不修改已安装的系统 preset；只修改用户插件仓库和用户 profile patch。
- ChatGPT OAuth token 与 DeepSeek API key 是不同凭据；插件不得读取、删除或复用 DeepSeek key。
- ChatGPT 订阅凭据不能自动被当作 OpenAI API key 或搜索 API key。
- 任何无法证明使用 ChatGPT 的辅助请求都必须停止或显式失败，不能静默回退到 DeepSeek。
- 插件 bundle 的 `cordis.patch.yml` 现在默认禁用 `web-search-deepseek` provider；安装说明仍提供旧版用户 profile 的补丁方式。通用 `web_search` 工具不删除，没有其他 provider 时明确失败。
