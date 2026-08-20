# 安装 / 卸载 / 故障恢复

## 前置条件

- 已安装 DeepSeek Harness（`dsh` CLI 在 PATH 中）
- 已安装 [pnpm](https://pnpm.io/)
- 使用 Web 界面（`dsh web`）
- 拥有 ChatGPT Plus / Pro 订阅（或包含 Codex 额度的套餐）

## 安装

两种方式任选其一：

```bash
# 方式一：一键脚本（推荐）
git clone https://github.com/songoao25/dsh-chatgpt-subscription.git
cd dsh-chatgpt-subscription
./install.sh
# 默认安装到 web profile；其他 profile 需以 `dsh web` 方式使用：
./install.sh --profile <profile名>

# 方式二：dsh 插件命令（先构建，lib/ 由 build 生成）
git clone https://github.com/songoao25/dsh-chatgpt-subscription.git
cd dsh-chatgpt-subscription
npm run build
dsh plugin --profile web add .
```

### 安装原理

`dsh plugin add` 会：

1. 用 pnpm 把插件包安装到 profile 目录（`~/.dsh/profiles/<name>/`）；
2. 检测到包声明了 `dsh.bundle`（`cordis.patch.yml`），自动把包名加入 profile 的 bundle 层列表；
3. 下次启动 `dsh` 时，插件随 profile 自动加载——host 注册 OAuth 流程与 RPC、client 注入设置页「订阅」。

**注意：安装后需要重启 `dsh web`（或重启 DSH）才会生效**——宿主进程在启动时组合插件。刷新页面不足以加载 host 端。

### 验证安装成功

```bash
dsh --profile web --dump-config | grep dsh-chatgpt-subscription
# 应看到 dsh-chatgpt-subscription 行（bundle 层已生效）
```

重启后 设置 → 订阅 页出现即安装成功。

## 绑定 ChatGPT 订阅

1. 打开 DSH **设置**（⚙️）→ 点击 **订阅**（紧挨「模型」下方）。
2. 点击「**授权登录**」→ 浏览器打开 OpenAI 官方授权页。
3. 用 ChatGPT 账号登录并同意；页面显示「已绑定」即完成。
4. 新建对话，在模型切换器选择提供商 **ChatGPT** 的模型（如 `gpt-5.6-terra`）对话。

> 若浏览器未自动打开，请允许 DSH 弹窗（页面会以 `window.open` 兜底）。
> 绑定后模型切换器出现 ChatGPT 提供商；对话消耗订阅额度。

## 卸载

```bash
cd dsh-chatgpt-subscription
./uninstall.sh
# 或手动：
dsh plugin --profile web remove dsh-chatgpt-subscription
```

卸载会清理：profile 插件条目、`llm-pi-ai.providers.openai-codex` 路由配置、`OPENAI_CODEX_API_KEY` 凭据、绑定标记目录。**保留** `~/.codex/auth.json`（codex CLI 自己的登录态）。重启后模型切换器的 ChatGPT 提供商自动消失。

## 搜索隔离（重要）

插件不会把 ChatGPT 订阅令牌当作搜索服务凭据，也不会读取、删除或记录 `DEEPSEEK_API_KEY` 的值。线路会随默认模型选择同步：

- 选择 ChatGPT：DeepSeek 搜索 provider 保持挂载但使用不存在的凭据引用，`web_search` 明确失败，不会调用 DeepSeek。
- 选择 DeepSeek：恢复原来的 `DEEPSEEK_API_KEY` 引用，DeepSeek 搜索恢复。

插件只保存并恢复搜索配置中的凭据引用，不保存 DeepSeek 密钥。模型切换器没有宿主事件时，插件每 3 秒检查一次默认选择；旧会话中明确选定的模型不被偷偷改写。

## 故障排查

| 现象 | 原因与处理 |
|---|---|
| 设置里没有「订阅」页 | ① 没重启：需重启 `dsh web`；② 装错 profile：确认启动用的 profile 与安装目标一致；③ `dsh --profile web --dump-config` 里没有 dsh-chatgpt-subscription：重新执行安装 |
| 点授权登录没反应/浏览器没打开 | ① 检查是否允许 DSH 弹窗；② 重启 DSH 后再试 |
| 提示「回调端口被占用」 | 端口 1455 被其他程序占用（如正在运行的 codex 登录流程），关闭占用程序后重试 |
| 授权超时（5 分钟） | 重新点「授权登录」再试；确认浏览器完成了授权 |
| 绑定后模型切换器无 ChatGPT | 确认绑定成功（订阅页显示已绑定）；重启 DSH 让路由注册生效 |
| 对话报错/模型不可用 | 可用模型以套餐为准（如 `gpt-5.3-codex-spark` 需更高计划）；检查订阅额度 |
| 安装报 `pnpm not found` | 安装 pnpm：`npm i -g pnpm` 或 `corepack enable` |
| 想彻底移除插件影响 | `./uninstall.sh` + 重启 DSH |

## 与其他插件的关系

- **[Bottom Info Bar](https://github.com/songoao25/dsh-bottom-info-bar)**：信息栏插件只读本插件维护的令牌，在底部信息栏显示 ChatGPT 额度（5 小时/周/月窗口与重置时间）。两者可独立安装；信息栏的 ChatGPT 额度显示需要本插件先绑定。
