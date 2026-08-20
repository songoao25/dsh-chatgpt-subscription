# 技术设计：ChatGPT / DeepSeek 双模式线路切换

## 核心原则

线路切换必须是“成对切换”，不能只改变聊天模型：聊天默认选择和 Web 搜索 provider 必须一起更新；任何不可证明属于当前模式的辅助能力都 fail closed（明确失败，不回退到另一供应商）。

## 状态模型

- `deepseek`：原始默认模型 + `deepseek-official` 搜索配置。
- `chatgpt`：`openai-codex` 默认模型 + 禁用 DeepSeek 搜索。
- 持久化前保存用户原始搜索配置和默认模型，重复切换幂等。
- 插件只恢复自己保存/修改的配置，不覆盖用户自定义 provider。

## 切换触发

1. ChatGPT OAuth 绑定成功：注册自有 `openai-codex` 路由，保存并切换默认模型，进入 ChatGPT 模式。
2. ChatGPT 解绑或令牌失效：清理凭据，恢复绑定前默认模型和搜索配置，进入 DeepSeek/原有模式。
3. 用户在模型切换器明确选回 DeepSeek：需要由 DSH 的默认模型选择事件或可观察设置变化触发搜索恢复；若宿主没有该事件，插件不得猜测，必须提供明确的受限状态和后续接入点。

## 能力边界

ChatGPT 订阅 OAuth 只证明 ChatGPT/Codex 模型线路，不证明可调用 OpenAI API 搜索、视觉、图片或其他工具。插件不把订阅 token 当 API key，不伪造能力，不静默调用 DeepSeek。

## 验证

- 静态测试验证两种 patch 状态、配置保存/恢复、用户配置保护、重复切换与异常回滚。
- 构建后验证 `lib/` 与 `src/` 一致。
- 独立 QA 验证模式矩阵；独立安全审计扫描凭据、个人路径、依赖和 OWASP 风险。
