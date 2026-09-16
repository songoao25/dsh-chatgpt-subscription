# dsh-chatgpt-subscription

**English** | [**中文**](README.zh-CN.md)

[![License: MIT](https://img.shields.io/github/license/SONGOAO25/dsh-chatgpt-subscription)](https://github.com/SONGOAO25/dsh-chatgpt-subscription/blob/main/LICENSE)
[![Release](https://img.shields.io/github/v/release/SONGOAO25/dsh-chatgpt-subscription)](https://github.com/SONGOAO25/dsh-chatgpt-subscription/releases)
[![CI](https://img.shields.io/github/actions/workflow/status/SONGOAO25/dsh-chatgpt-subscription/ci.yml)](https://github.com/SONGOAO25/dsh-chatgpt-subscription/actions)
[![Last Commit](https://img.shields.io/github/last-commit/SONGOAO25/dsh-chatgpt-subscription)](https://github.com/SONGOAO25/dsh-chatgpt-subscription)
[![Stars](https://img.shields.io/github/stars/SONGOAO25/dsh-chatgpt-subscription)](https://github.com/SONGOAO25/dsh-chatgpt-subscription)
[![Dependabot](https://img.shields.io/badge/dependabot-enabled-025e8c?logo=dependabot)](https://github.com/SONGOAO25/dsh-chatgpt-subscription/security/dependabot)

A [DeepSeek Harness](https://github.com/deepseek-ai) plugin that lets you **sign in with your ChatGPT account using the official OAuth flow** and chat with ChatGPT models inside DSH, consuming your ChatGPT Plus / Pro subscription quota.

**One-click official sign-in** — Click **授权登录** on the new **「订阅」page** in DSH **Settings** → your browser opens OpenAI's official authorization page → approve → you're bound. No API keys, no command line, no config file editing.

## Features

- **Official OAuth binding** — Full PKCE + state flow against `auth.openai.com`, the same official mechanism used by Codex CLI and OpenCode. Your tokens are exchanged directly with OpenAI; the plugin never sees or stores your password.
- **Strict official mode** — Only an authorization completed through this plugin's settings page counts as bound. Your existing `codex` CLI login is left alone and is never silently reused.
- **ChatGPT models in DSH** — After binding, ChatGPT models (e.g. `gpt-5.6-terra`, `gpt-5.5`, `gpt-5.4`) appear in the DSH model switcher as provider **ChatGPT**. Selecting one talks to ChatGPT directly and consumes your subscription quota.
- **Token guardian** — The access token is auto-refreshed before expiry (JWT-aware, refresh threshold 45 min) and injected into DSH credentials. Runs once at startup and every 30 minutes; on failure it keeps the last known good state instead of crashing.
- **Bind status page** — The **Settings → 订阅** page shows bound/unbound status, token expiry and remaining time, with **授权登录 / 重新授权 / 解绑** actions.
- **Companion to [Bottom Info Bar](https://github.com/SONGOAO25/dsh-bottom-info-bar)** — This plugin owns binding and token maintenance; the Bottom Info Bar reads the token to display your ChatGPT quota (5-hour / weekly / monthly windows and reset times). You can use this plugin without the info bar, but the info bar's ChatGPT quota display requires this plugin.

## Requirements

- [DeepSeek Harness](https://github.com/deepseek-ai) (`dsh` CLI) running the web interface (`dsh web`)
- [pnpm](https://pnpm.io/) (used by `dsh plugin`)
- A ChatGPT **Plus** or **Pro** subscription (or a plan that includes Codex quota)

## Installation

### Option 1 — One-command script (recommended)

```bash
git clone https://github.com/SONGOAO25/dsh-chatgpt-subscription.git
cd dsh-chatgpt-subscription
./install.sh                # installs to the "web" profile; use --profile <name> to override
```

### Option 2 — dsh plugin command

```bash
git clone https://github.com/SONGOAO25/dsh-chatgpt-subscription.git
cd dsh-chatgpt-subscription
npm run build               # build lib/ from src/
dsh plugin --profile web add .
```

> **Restart `dsh web` after installing.** Plugins are composed when the host process starts; a page refresh alone is not enough.

## Usage

1. Restart `dsh web`, then open **Settings** (⚙️) in the sidebar.
2. Click **订阅** (right below **模型**).
3. Click **授权登录** — your browser opens the official OpenAI sign-in page.
4. Sign in with your ChatGPT account and approve. The page shows **已绑定** when done.
5. Open a new conversation, switch the model to a ChatGPT model (provider **ChatGPT**, e.g. `gpt-5.6-terra`) and chat — usage counts against your subscription.

> If the browser tab doesn't open automatically, the page also calls `window.open` as a fallback; allow pop-ups for DSH if prompted.

## Security

- Tokens are stored only in `~/.codex/auth.json` (0600, the standard location shared with Codex CLI) and in DSH's credential store — never in logs, never in this repository.
- The local OAuth callback server binds **127.0.0.1 only**, validates `state` (CSRF protection), and times out after 5 minutes.
- Unbinding removes the binding flag and the injected credential, but **keeps** `~/.codex/auth.json` untouched — your Codex CLI login stays intact.
- Zero runtime dependencies (only `react` as a peer for the client half); no network calls except the official OpenAI endpoints.

## Uninstall

```bash
cd dsh-chatgpt-subscription
./uninstall.sh              # removes the plugin and the injected route/credential
```

Uninstall keeps `~/.codex/auth.json` (your Codex CLI login) and only cleans what this plugin added: the binding flag, the `openai-codex` provider route, and the `OPENAI_CODEX_API_KEY` credential.

## FAQ

**Q: Do I need a ChatGPT Plus subscription?**
Yes — the plugin connects your ChatGPT account; chatting with ChatGPT models consumes your subscription quota (models available depend on your plan, e.g. `gpt-5.3-codex-spark` requires a higher plan).

**Q: Does this share my tokens?**
No. Everything happens between your machine and `auth.openai.com` / `chatgpt.com`. Tokens never leave your machine and are never logged.

**Q: What if the token expires?**
The plugin auto-refreshes it before expiry. If refresh fails (e.g. revoked), the settings page shows a clear hint to re-authorize.

**Q: Does this affect my Codex CLI login?**
No. The plugin writes to the same standard `~/.codex/auth.json` location and preserves its structure; unbinding doesn't delete it.

**Q: Can I see my quota?**
Install the companion [Bottom Info Bar](https://github.com/SONGOAO25/dsh-bottom-info-bar) plugin — it reads the token this plugin maintains and displays your ChatGPT quota (remaining percent and reset time) in the bottom info bar.

## License

[MIT](LICENSE) © 2026 SONGOAO25
