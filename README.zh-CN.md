# ChatGPT 订阅

[**English**](README.md) | **中文**

[![License: MIT](https://img.shields.io/github/license/SONGOAO25/dsh-chatgpt-subscription)](https://github.com/SONGOAO25/dsh-chatgpt-subscription/blob/main/LICENSE)
[![Release](https://img.shields.io/github/v/release/SONGOAO25/dsh-chatgpt-subscription)](https://github.com/SONGOAO25/dsh-chatgpt-subscription/releases)
[![CI](https://img.shields.io/github/actions/workflow/status/SONGOAO25/dsh-chatgpt-subscription/ci.yml)](https://github.com/SONGOAO25/dsh-chatgpt-subscription/actions)
[![Last Commit](https://img.shields.io/github/last-commit/SONGOAO25/dsh-chatgpt-subscription)](https://github.com/SONGOAO25/dsh-chatgpt-subscription)
[![Stars](https://img.shields.io/github/stars/SONGOAO25/dsh-chatgpt-subscription)](https://github.com/SONGOAO25/dsh-chatgpt-subscription)
[![Dependabot](https://img.shields.io/badge/dependabot-enabled-025e8c?logo=dependabot)](https://github.com/SONGOAO25/dsh-chatgpt-subscription/security/dependabot)

一个 [DeepSeek Harness](https://github.com/deepseek-ai)（DSH）插件：用 OpenAI 官方 OAuth 登录 ChatGPT 账号，之后在 DSH 里使用 ChatGPT 模型，消耗你的 ChatGPT Plus/Pro 订阅额度。

**官方登录** —— 在 DSH **插件** 页进入 **ChatGPT 订阅**，点「**绑定 ChatGPT 账号**」，在浏览器里同意授权即完成绑定。不需要 API Key，也不用改配置文件。

## 功能

- **官方 OAuth 绑定** —— 完整 PKCE + state 流程对接 `auth.openai.com`，与 Codex CLI / OpenCode 同款官方机制；令牌与 OpenAI 直接交换，插件不接触你的密码。
- **严格官方模式** —— 只有通过本插件页面完成的授权才算绑定；你已有的 `codex` CLI 登录态不被自动挪用、互不干扰。
- **DSH 内使用 ChatGPT 模型** —— 绑定后，模型切换器出现提供商 **ChatGPT** 的模型（如 `gpt-5.6-terra` / `gpt-5.5` / `gpt-5.4`），选择即对话，消耗订阅额度。
- **令牌看护** —— 令牌临近过期自动续期（JWT 感知，45 分钟提前量）并注入 DSH 凭据；启动即跑一次 + 每 30 分钟维护；失败保留上次正常状态，不崩溃。
- **状态页** —— 插件详情页显示绑定的账号、登录有效期与剩余时间，提供「绑定 ChatGPT 账号 / 重新绑定 / 解绑」操作。
- **与 [Bottom Info Bar](https://github.com/songoao25/dsh-bottom-info-bar) 配套** —— 本插件负责绑定与令牌维护；信息栏插件读取令牌显示 ChatGPT 额度（5 小时 / 周 / 月窗口与重置时间）。本插件可单独使用，但信息栏的 ChatGPT 额度显示依赖本插件。

## 前置条件

- 已安装 DeepSeek Harness —— **桌面端客户端**，或使用 Web 界面的 CLI profile（`dsh web`）
- 已安装 [pnpm](https://pnpm.io/)（`dsh plugin` 与插件页的安装框都依赖它）
- 拥有 ChatGPT **Plus** 或 **Pro** 订阅（或包含 Codex 额度的套餐）

## 安装

### 方式一：在 DSH 里装 —— **插件 → 添加插件**（桌面端也用这条）

打开 DSH 的 **插件 → 添加插件**，在「包名或地址」里填入仓库地址：

```
https://github.com/SONGOAO25/dsh-chatgpt-subscription
```

包就在仓库根目录，且 `lib/` 已入库，所以填地址安装**不跑构建、也不会弹「待批准的构建脚本」**。同一个框也接受本仓库工作副本的绝对路径（用于开发）。

**本插件不发布 npm 包**：那一栏填包名 `dsh-chatgpt-subscription` 只会报「未找到相关插件」，请始终填上面的仓库地址。

**桌面端客户端只能用这条**：DSH 的 `desktop` profile 由客户端自己管理，命令行 `dsh plugin --profile desktop` 会被直接拒绝。

装完**重启 DSH** —— 插件在宿主进程启动时组合加载，仅刷新页面不够。

### 方式二：命令行的 `dsh plugin`

用你实际启动的那个 profile（`dsh web` 启动的是 `web`）：

```bash
# 跟随仓库默认分支（不跑构建，lib/ 已入库）
dsh plugin --profile web add https://github.com/SONGOAO25/dsh-chatgpt-subscription
```

命令行同样没有包名可填——本插件不发布 npm 包，填包名只会报「未找到相关插件」。

`--profile desktop` 是被有意拒绝的 —— 那个 profile 归桌面端客户端管，请改用 **插件 → 添加插件**。

### 方式三：一键脚本（产生 `link:` 安装）

用于开发，或想跑未发布的代码：

```bash
git clone https://github.com/SONGOAO25/dsh-chatgpt-subscription.git
cd dsh-chatgpt-subscription
./install.sh                # 默认安装到 web profile；可用 --profile <name> 指定
```

`link:` 安装跟随你的工作副本，而不是仓库默认分支 —— 更新方式见[更新版本](#更新版本)。

> 请用仓库地址安装：本插件不在 npm 上，填包名一定会报**「未找到相关插件」**。

装好后进入 **插件 → ChatGPT 订阅**。完整的安装 / 更新 / 故障排查见 [docs/INSTALL.md](docs/INSTALL.md)。

## 使用方法

1. 重启 DSH，打开 **插件** 页，点进 **ChatGPT 订阅**。
2. 点「**绑定 ChatGPT 账号**」——浏览器打开 OpenAI 官方登录页。
3. 用 ChatGPT 账号登录并同意授权；页面显示「**已连接**」即完成。
4. 新建对话，在模型切换器选择提供商 **ChatGPT** 的模型（如 `gpt-5.6-terra`）对话，额度计入订阅。

> 若浏览器没有自动打开，页面会以 `window.open` 兜底；请允许 DSH 的弹窗。

## 更新版本

| 你的安装方式 | 更新命令 |
|---|---|
| 仓库地址（插件页或命令行） | 再执行一次同样的地址安装，然后重启 DSH |
| `link:`（一键脚本或本地代码） | `git -C <仓库> fetch origin && git -C <仓库> merge --ff-only origin/main && node <仓库>/scripts/build.mjs`，然后重启 DSH |

更新是手动的：磁盘上的一切改动都要等你执行命令之后才发生。详见 [docs/INSTALL.md](docs/INSTALL.md#更新)。

## 安全说明

- 令牌只存于 `~/.codex/auth.json`（0600，与 Codex CLI 共用的标准位置）与 DSH 凭据库——不进日志、不进本仓库。
- 本地回调服务**仅监听 127.0.0.1**，校验 `state`（防 CSRF），5 分钟超时自动结束。
- 解绑只清除绑定标记与注入的凭据，**不动** `~/.codex/auth.json`——你的 Codex CLI 登录态保持完整。
- 零运行时依赖（client 半仅 `react` peer）；除官方 OpenAI 端点外无任何网络请求。

## 卸载

桌面端客户端：在 **插件** 页里卸载。命令行：

```bash
cd dsh-chatgpt-subscription
./uninstall.sh              # 移除插件及注入的路由/凭据
```

卸载保留 `~/.codex/auth.json`（你的 Codex CLI 登录态），只清理本插件添加的内容：绑定标记、`openai-codex` 提供商路由、`OPENAI_CODEX_API_KEY` 凭据。

## 常见问题

**问：桌面端客户端怎么装？**
打开 **插件 → 添加插件**，填入 `https://github.com/SONGOAO25/dsh-chatgpt-subscription`。桌面端自己管理 `desktop` profile，`dsh plugin --profile desktop` 会被拒绝——插件页就是入口。

**问：安装时提示要批准构建脚本？**
那是装到的清单里声明了安装期脚本（`prepare` / `prepack`）。本仓库的清单只保留 `prepublishOnly`，所以填最新提交的仓库地址安装**不跑构建、也不需要批准**——重新用最新地址装一次即可。

**问：npm 上有这个包吗？**
没有。插件只从本仓库分发——安装时填仓库地址（插件页或 `dsh plugin add` 都可以）。`package.json` 里的 `name` 是 DSH 的模块名，不是已发布的 npm 包。

**问：需要 ChatGPT Plus 订阅吗？**
需要。插件连接你的 ChatGPT 账号，使用 ChatGPT 模型对话消耗订阅额度（可用模型视套餐而定，如 `gpt-5.3-codex-spark` 需更高套餐）。

**问：会泄露令牌吗？**
不会。一切只发生在本机与 `auth.openai.com` / `chatgpt.com` 之间；令牌不出本机、不进日志。

**问：令牌过期了怎么办？**
插件会在过期前自动续期；续期失败（比如授权已被撤销）时，插件详情页会说明出了什么问题。

**问：会影响我的 Codex CLI 登录吗？**
不会。插件写入同一个标准位置 `~/.codex/auth.json` 并保留其结构；解绑也不删除它。

**问：能看到我的额度吗？**
安装配套插件 [Bottom Info Bar](https://github.com/songoao25/dsh-bottom-info-bar)——它读取本插件维护的令牌，在底部信息栏显示 ChatGPT 额度（剩余百分比与重置时间）。

## 许可证

[MIT](LICENSE) © 2026 SONGOAO25
