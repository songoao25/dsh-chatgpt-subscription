# ChatGPT 订阅插件

[**English**](README.md) | **中文**

[![License: MIT](https://img.shields.io/github/license/SONGOAO25/dsh-chatgpt-subscription)](https://github.com/SONGOAO25/dsh-chatgpt-subscription/blob/main/LICENSE)
[![Release](https://img.shields.io/github/v/release/SONGOAO25/dsh-chatgpt-subscription)](https://github.com/SONGOAO25/dsh-chatgpt-subscription/releases)
[![CI](https://img.shields.io/github/actions/workflow/status/SONGOAO25/dsh-chatgpt-subscription/ci.yml)](https://github.com/SONGOAO25/dsh-chatgpt-subscription/actions)
[![Last Commit](https://img.shields.io/github/last-commit/SONGOAO25/dsh-chatgpt-subscription)](https://github.com/SONGOAO25/dsh-chatgpt-subscription)
[![Stars](https://img.shields.io/github/stars/SONGOAO25/dsh-chatgpt-subscription)](https://github.com/SONGOAO25/dsh-chatgpt-subscription)
[![Dependabot](https://img.shields.io/badge/dependabot-enabled-025e8c?logo=dependabot)](https://github.com/SONGOAO25/dsh-chatgpt-subscription/security/dependabot)

一个 [DeepSeek Harness](https://github.com/deepseek-ai)（DSH）插件：**用官方 OAuth 一键绑定你的 ChatGPT 账号**，在 DSH 里直接使用 ChatGPT 模型对话，消耗你的 ChatGPT Plus/Pro 订阅额度。

**官方一键授权** —— 在 DSH **设置 → 订阅**页点「**授权登录**」→ 浏览器打开 OpenAI 官方授权页 → 登录并同意 → 绑定完成。无需 API Key、无需命令行、无需改配置文件。

## 功能

- **官方 OAuth 绑定** —— 完整 PKCE + state 流程对接 `auth.openai.com`，与 Codex CLI / OpenCode 同款官方机制；令牌与 OpenAI 直接交换，插件不接触你的密码。
- **严格官方模式** —— 只有通过本插件设置页完成的授权才算绑定；你已有的 `codex` CLI 登录态不被自动挪用、互不干扰。
- **DSH 内使用 ChatGPT 模型** —— 绑定后，模型切换器出现提供商 **ChatGPT** 的模型（如 `gpt-5.6-terra` / `gpt-5.5` / `gpt-5.4`），选择即对话，消耗订阅额度。
- **令牌看护** —— 令牌临近过期自动续期（JWT 感知，45 分钟提前量）并注入 DSH 凭据；启动即跑一次 + 每 30 分钟维护；失败保留上次正常状态，不崩溃。
- **绑定状态页** —— **设置 → 订阅**页展示 已绑定/未绑定、令牌有效期与剩余时间，提供「授权登录 / 重新授权 / 解绑」操作。
- **与 [Bottom Info Bar](https://github.com/SONGOAO25/dsh-bottom-info-bar) 配套** —— 本插件负责绑定与令牌维护；信息栏插件读取令牌显示 ChatGPT 额度（5 小时 / 周 / 月窗口与重置时间）。本插件可单独使用，但信息栏的 ChatGPT 额度显示依赖本插件。

## 前置条件

- 已安装 [DeepSeek Harness](https://github.com/deepseek-ai)（`dsh` CLI）并使用 Web 界面（`dsh web`）
- 已安装 [pnpm](https://pnpm.io/)（`dsh plugin` 依赖）
- 拥有 ChatGPT **Plus** 或 **Pro** 订阅（或包含 Codex 额度的套餐）

## 安装

### 方式一：一键脚本（推荐）

```bash
git clone https://github.com/SONGOAO25/dsh-chatgpt-subscription.git
cd dsh-chatgpt-subscription
./install.sh                # 默认安装到 web profile；可用 --profile <name> 指定
```

### 方式二：dsh 插件命令

```bash
git clone https://github.com/SONGOAO25/dsh-chatgpt-subscription.git
cd dsh-chatgpt-subscription
npm run build               # 由 src/ 构建 lib/
dsh plugin --profile web add .
```

> **安装后需重启 `dsh web` 生效** —— 插件在宿主进程启动时组合加载，仅刷新页面不够。

## 使用方法

1. 重启 `dsh web`，打开左侧 **设置**（⚙️）。
2. 点击 **订阅**（紧挨「模型」下方）。
3. 点击「**授权登录**」——浏览器打开 OpenAI 官方登录页。
4. 用 ChatGPT 账号登录并同意授权；页面显示「**已绑定**」即完成。
5. 新建对话，在模型切换器选择提供商 **ChatGPT** 的模型（如 `gpt-5.6-terra`）对话，额度计入订阅。

> 若浏览器没有自动打开，页面会以 `window.open` 兜底；请允许 DSH 的弹窗。

## 安全说明

- 令牌只存于 `~/.codex/auth.json`（0600，与 Codex CLI 共用的标准位置）与 DSH 凭据库——不进日志、不进本仓库。
- 本地回调服务**仅监听 127.0.0.1**，校验 `state`（防 CSRF），5 分钟超时自动结束。
- 解绑只清除绑定标记与注入的凭据，**不动** `~/.codex/auth.json`——你的 Codex CLI 登录态保持完整。
- 零运行时依赖（client 半仅 `react` peer）；除官方 OpenAI 端点外无任何网络请求。

## 卸载

```bash
cd dsh-chatgpt-subscription
./uninstall.sh              # 移除插件及注入的路由/凭据
```

卸载保留 `~/.codex/auth.json`（你的 Codex CLI 登录态），只清理本插件添加的内容：绑定标记、`openai-codex` 提供商路由、`OPENAI_CODEX_API_KEY` 凭据。

## 常见问题

**问：需要 ChatGPT Plus 订阅吗？**
需要。插件连接你的 ChatGPT 账号，使用 ChatGPT 模型对话消耗订阅额度（可用模型视套餐而定，如 `gpt-5.3-codex-spark` 需更高套餐）。

**问：会泄露令牌吗？**
不会。一切只发生在本机与 `auth.openai.com` / `chatgpt.com` 之间；令牌不出本机、不进日志。

**问：令牌过期了怎么办？**
插件会在过期前自动续期；若续期失败（如已被撤销），设置页会给出明确提示，重新授权即可。

**问：会影响我的 Codex CLI 登录吗？**
不会。插件写入同一个标准位置 `~/.codex/auth.json` 并保留其结构；解绑也不删除它。

**问：能看到我的额度吗？**
安装配套插件 [Bottom Info Bar](https://github.com/SONGOAO25/dsh-bottom-info-bar)——它读取本插件维护的令牌，在底部信息栏显示 ChatGPT 额度（剩余百分比与重置时间）。

## 许可证

[MIT](LICENSE) © 2026 SONGOAO25
