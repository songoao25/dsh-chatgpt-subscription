# 审计报告：dsh-chatgpt-subscription

日期：2026-08-20
范围：OAuth 绑定、ChatGPT 路由、默认模型、凭据生命周期、RPC 安全、客户端轮询、发布产物与依赖。

## 结论

本轮代码修复已完成，自动化验收通过。插件回归「纯订阅绑定」定位：只负责 OAuth 绑定、令牌看护与 `openai-codex` 模型路由，**不管理联网搜索配置**——搜索商由用户在 DSH 配置层自行指定，插件从不读取、改写或切换搜索设置。用户明确选择的旧会话模型、视觉工具和子代理仍由 DSH 各自管理，插件不伪造 ChatGPT 未提供的能力。

## 功能验收

| 需求 | 结果 | 说明 |
|---|---|---|
| OAuth PKCE/state/本地回调 | ✅ | 回调仅监听 127.0.0.1，校验 state，令牌端点使用 HTTPS |
| ChatGPT 路由注册 | ✅ | 仅使用 `OPENAI_CODEX_API_KEY`；同名自定义路由不覆盖并明确报错 |
| 绑定后默认模型 | ✅ | 保存旧选择，切换到 `openai-codex / gpt-5.6-luna`；可用环境变量覆盖模型名 |
| 解绑与失效收敛 | ✅ | 清理插件注入凭据；解绑清理插件拥有的路由；默认选择按条件恢复 |
| 文件安全 | ✅ | auth/bind 原子写入并显式 0600；插件数据目录按 0700 创建 |
| 并发与状态 | ✅ | 同步单飞，OAuth 注入失败不再显示健康成功 |
| 搜索配置用户自管 | ✅ | 插件不触碰任何搜索设置；静态断言验证无 `SEARCH_SETTINGS_NAMESPACE` / `setSearchMode`，不读取、删除或记录搜索密钥 |
| RPC 安全 | ✅ | 有副作用的方法只允许 POST，并要求严格 same-origin |
| 客户端稳定性 | ✅ | RPC 15 秒超时、HTTP 状态检查、授权轮询错误和卸载清理 |
| 产物与依赖 | ✅ | `lib/` 由 build 生成；已加入 package-lock，CI 使用 npm ci、audit 和产物一致性检查 |

## 测试结果

- `npm test`：**70 PASS / 0 FAIL**
- `npm run build`：成功
- `npm audit --omit=dev --audit-level=high`：0 vulnerabilities
- `git diff --check`：通过
- `dsh --profile web --dump-config`：确认 `dsh-chatgpt-subscription` 挂载，插件行不含任何搜索配置引用

## 安全检查

- [x] 源码、构建产物、Git 历史未发现真实密钥或 token 日志
- [x] OAuth 回调 state + PKCE + 127.0.0.1
- [x] start OAuth / unbind RPC 严格 same-origin 且仅 POST
- [x] 令牌不进入错误消息、日志或 RPC 返回
- [x] 只清理插件自己注入的凭据和自己创建的路由，不删除用户已有同名配置
- [x] auth/bind 文件原子写入和 0600
- [x] 卸载脚本拒绝删除默认插件目录之外的路径
- [x] 依赖锁定并完成运行时依赖审计

## 用户侧必须处理

1. 已经出现在本机凭据文件中的 DeepSeek、OpenCode、OpenAI/Codex 凭据应在对应服务后台撤销并重新生成；插件不能替用户撤销远端密钥。
2. 如果此前运行过旧版本，必须重启 DSH；旧进程内存中的路由不会自动消失。
3. 视觉工具当前是独立线路，不会自动改成 ChatGPT；若不想产生其他模型费用，应在 DSH 设置中关闭或单独更换视觉 provider。
4. 旧会话和手动选中的 DeepSeek 模型仍可能调用 DeepSeek；这是显式用户选择，不是插件暗中回退。

## 遗留边界

| 问题 | 严重度 | 处理 |
|---|---:|---|
| ChatGPT OAuth 真实账号端到端授权未在自动化环境执行 | 中 | 用户重启后完成一次真实授权验证 |
| ChatGPT 订阅额度与 token 用量不能由插件独立精确计价 | 中 | 额度展示交给配套信息栏；插件不伪造价格或额度 |
| ChatGPT 视觉、旧会话、显式 DeepSeek 路由不受插件强制接管 | 中 | 在设置和文档中明确线路边界 |
