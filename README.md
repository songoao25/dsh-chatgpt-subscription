# ChatGPT Subscription

**English** | [**中文**](README.zh-CN.md)

[![License: MIT](https://img.shields.io/github/license/SONGOAO25/dsh-chatgpt-sub)](https://github.com/SONGOAO25/dsh-chatgpt-sub/blob/main/LICENSE)
[![Release](https://img.shields.io/github/v/release/SONGOAO25/dsh-chatgpt-sub)](https://github.com/SONGOAO25/dsh-chatgpt-sub/releases)
[![CI](https://img.shields.io/github/actions/workflow/status/SONGOAO25/dsh-chatgpt-sub/ci.yml)](https://github.com/SONGOAO25/dsh-chatgpt-sub/actions)
[![Last Commit](https://img.shields.io/github/last-commit/SONGOAO25/dsh-chatgpt-sub)](https://github.com/SONGOAO25/dsh-chatgpt-sub)
[![Stars](https://img.shields.io/github/stars/SONGOAO25/dsh-chatgpt-sub)](https://github.com/SONGOAO25/dsh-chatgpt-sub)
[![Dependabot](https://img.shields.io/badge/dependabot-enabled-025e8c?logo=dependabot)](https://github.com/SONGOAO25/dsh-chatgpt-sub/security/dependabot)

A [DeepSeek Harness](https://github.com/deepseek-ai) plugin: sign in with your ChatGPT account through OpenAI's official OAuth flow, then use ChatGPT models inside DSH. Model calls use your ChatGPT Plus / Pro subscription quota.

**Official sign-in** — Open **Plugins**, then **ChatGPT Subscription**, and click **Sign in with ChatGPT**. Approve in the browser and the account is bound. No API keys, no config files.

## Features

- **Official OAuth binding** — Full PKCE + state flow against `auth.openai.com`, the same official mechanism used by Codex CLI and OpenCode. Your tokens are exchanged directly with OpenAI; the plugin never sees or stores your password.
- **Strict official mode** — Only an authorization completed through this plugin's page counts as bound. Your existing `codex` CLI login is left alone and is never silently reused.
- **ChatGPT models in DSH** — After binding, ChatGPT models (e.g. `gpt-5.6-terra`, `gpt-5.5`, `gpt-5.4`) appear in the DSH model switcher as provider **ChatGPT**. Selecting one talks to ChatGPT directly and consumes your subscription quota.
- **Token guardian** — The access token is auto-refreshed before expiry (JWT-aware, refresh threshold 45 min) and injected into DSH credentials. Runs once at startup and every 30 minutes; on failure it keeps the last known good state instead of crashing.
- **Status page** — The plugin page shows the bound account, sign-in validity and time remaining, with **Sign in with ChatGPT / Sign in again / Unbind** actions.
- **Companion to [Bottom Info Bar](https://github.com/songoao25/dsh-bottom-info-bar)** — This plugin owns binding and token maintenance; the Bottom Info Bar reads the token to display your ChatGPT quota (5-hour / weekly / monthly windows and reset times). You can use this plugin without the info bar, but the info bar's ChatGPT quota display requires this plugin.

## Requirements

- DeepSeek Harness — the **desktop app** or a CLI profile with the web interface (`dsh web`)
- [pnpm](https://pnpm.io/) (used by `dsh plugin` and by the plugin page's install box)
- A ChatGPT **Plus** or **Pro** subscription (or a plan that includes Codex quota)

## Installation

### Option 1 — Install inside DSH: **Plugins → Add plugin** (works in the desktop app)

Open **Plugins → Add plugin** and enter either the package name (recommended) or the repository address in the "package name or address" box:

```
dsh-chatgpt-sub
```

```
https://github.com/SONGOAO25/dsh-chatgpt-sub
```

The package name installs the published version from npm; the repository address installs from the repository root — `lib/` is committed, so no build step runs and no build-script approval is asked. The same box also accepts an absolute path to a checkout of this repository (for development).

This is the way to install in the **desktop app**: DSH manages its `desktop` profile itself and the CLI rejects `dsh plugin --profile desktop`, so the plugin page is the only install path there.

Then **restart DSH** — plugins are composed when the host process starts, so a page refresh is not enough.

### Option 2 — `dsh plugin` on the command line

Use the profile you actually boot (`dsh web` boots the `web` profile):

```bash
# npm release (recommended)
dsh plugin --profile web add dsh-chatgpt-sub

# or the repository's default branch (no build runs; lib/ is committed)
dsh plugin --profile web add https://github.com/SONGOAO25/dsh-chatgpt-sub
```

`--profile desktop` is refused by design — that profile belongs to the desktop app. Install through **Plugins → Add plugin** there instead.

### Option 3 — One-command script (a `link:` install)

For development, or to run unreleased code:

```bash
git clone https://github.com/SONGOAO25/dsh-chatgpt-sub.git
cd dsh-chatgpt-sub
./install.sh                # installs to the "web" profile; use --profile <name> to override
```

A `link:` install tracks your checkout rather than npm / the repository's default branch — see [Updating](#updating).

> Installed from the old address `https://github.com/SONGOAO25/dsh-chatgpt-subscription`? Nothing to do: GitHub redirects it to the renamed repository. To standardize on the new package name, just install by package name once — the binding data migrates automatically, no sign-in needed.

After installing, open **Plugins → ChatGPT Subscription**. See [docs/INSTALL.md](docs/INSTALL.md) for the full install, update and troubleshooting guide.

## Usage

1. Restart DSH, then open **Plugins** and click **ChatGPT Subscription**.
2. Click **Sign in with ChatGPT** — your browser opens the official OpenAI sign-in page.
3. Sign in with your ChatGPT account and approve. The page shows **Connected** when done.
4. Open a new conversation, switch the model to a ChatGPT model (provider **ChatGPT**, e.g. `gpt-5.6-terra`) and chat — usage counts against your subscription.

> If the browser tab doesn't open automatically, the page also calls `window.open` as a fallback; allow pop-ups for DSH if prompted.

## Updating

| How you installed | How to update |
|---|---|
| Package name `dsh-chatgpt-sub` (plugin page or CLI) | run the same install again — it picks up the latest npm release — then restart DSH |
| Repository address (plugin page or CLI) | run the same address install again — it picks up the repository's default branch — then restart DSH |
| `link:` — one-command script or a local checkout | `git -C <repo> fetch origin && git -C <repo> merge --ff-only origin/main && node <repo>/scripts/build.mjs`, then restart DSH |

Updating is manual — nothing changes on disk until you run the command. Details: [docs/INSTALL.md](docs/INSTALL.md#更新).

## Security

- Tokens are stored only in `~/.codex/auth.json` (0600, the standard location shared with Codex CLI) and in DSH's credential store — never in logs, never in this repository.
- The local OAuth callback server binds **127.0.0.1 only**, validates `state` (CSRF protection), and times out after 5 minutes.
- Unbinding removes the binding flag and the injected credential, but **keeps** `~/.codex/auth.json` untouched — your Codex CLI login stays intact.
- Zero runtime dependencies (only `react` as a peer for the client half); no network calls except the official OpenAI endpoints.

## Uninstall

In the desktop app, remove the plugin from **Plugins**. On the CLI:

```bash
cd dsh-chatgpt-sub
./uninstall.sh              # removes the plugin and the injected route/credential
```

Uninstall keeps `~/.codex/auth.json` (your Codex CLI login) and only cleans what this plugin added: the binding flag, the `openai-codex` provider route, and the `OPENAI_CODEX_API_KEY` credential.

## FAQ

**Q: How do I install this on the desktop app?**
Open **Plugins → Add plugin** and enter the package name `dsh-chatgpt-sub` or the repository address. The desktop app manages its own `desktop` profile, so `dsh plugin --profile desktop` is refused — the plugin page is the way in.

**Q: I installed it under the old name. Anything to do?**
No. The old address `https://github.com/SONGOAO25/dsh-chatgpt-subscription` redirects to the renamed repository, and existing installs keep updating. To standardize on the new package name `dsh-chatgpt-sub`, install by package name once; the binding data lives on this machine and migrates automatically — no sign-in needed.

**Q: The plugin page asks me to approve a build script.**
The installed manifest declares an install-time script (`prepare` / `prepack`). This repository's manifest keeps only `prepublishOnly`, so installing by package name or by the repository address runs no build and asks for no approval.

**Q: Is this on npm?**
Yes — the package name is `dsh-chatgpt-sub`, matching the repository name. Both the plugin page and `dsh plugin add` accept the package name or the repository address.

**Q: Do I need a ChatGPT Plus subscription?**
Yes — the plugin connects your ChatGPT account; chatting with ChatGPT models consumes your subscription quota (models available depend on your plan, e.g. `gpt-5.3-codex-spark` requires a higher plan).

**Q: Does this share my tokens?**
No. Everything happens between your machine and `auth.openai.com` / `chatgpt.com`. Tokens never leave your machine and are never logged.

**Q: What if the token expires?**
The plugin refreshes it before expiry. If the refresh fails (for example the sign-in was revoked), the plugin page says what happened.

**Q: Does this affect my Codex CLI login?**
No. The plugin writes to the same standard `~/.codex/auth.json` location and preserves its structure; unbinding doesn't delete it.

**Q: Can I see my quota?**
Install the companion [Bottom Info Bar](https://github.com/SONGOAO25/dsh-bottom-info-bar) plugin — it reads the token this plugin maintains and displays your ChatGPT quota (remaining percent and reset time) in the bottom info bar.

## License

[MIT](LICENSE) © 2026 SONGOAO25
