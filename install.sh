#!/usr/bin/env bash
# dsh-chatgpt-sub — 一键安装脚本
# 用法：./install.sh [--profile <name>]   （默认安装到 web profile）
#
# 桌面端客户端（desktop profile）不能用本脚本：那个 profile 由客户端自己管理，
# 请在客户端内「插件 → 添加插件」填入仓库地址安装。
set -euo pipefail

REPO_URL="https://github.com/SONGOAO25/dsh-chatgpt-sub"
PROFILE="web"
while [[ $# -gt 0 ]]; do
  case "$1" in
    --profile) PROFILE="$2"; shift 2 ;;
    -h|--help) echo "用法: ./install.sh [--profile <name>]"; exit 0 ;;
    *) echo "未知参数: $1"; exit 1 ;;
  esac
done

case "$(printf '%s' "$PROFILE" | tr '[:upper:]' '[:lower:]')" in
  desktop)
    echo "错误：profile 'desktop' 由 DeepSeek Harness 桌面端客户端自己管理，命令行无法安装。"
    echo "      请在客户端内「插件 → 添加插件」填入以下地址安装："
    echo "      $REPO_URL"
    exit 1 ;;
esac

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

command -v dsh >/dev/null 2>&1 || { echo "错误：未找到 dsh CLI（请先安装 DeepSeek Harness）"; exit 1; }
command -v pnpm >/dev/null 2>&1 || { echo "错误：未找到 pnpm（安装：npm i -g pnpm 或 corepack enable）"; exit 1; }
command -v node >/dev/null 2>&1 || { echo "错误：未找到 node"; exit 1; }

echo "==> 构建插件产物（lib/ 已入库；这里重建一次，保证跑的和 src/ 一致）"
node "$ROOT/scripts/build.mjs" || { echo "错误：插件构建失败"; exit 1; }

echo "==> 安装 dsh-chatgpt-sub 到 profile '$PROFILE'"
dsh plugin --profile "$PROFILE" add "$ROOT"

echo
echo "✔ 安装完成。"
echo "  下一步：重启 DeepSeek Harness 后，在 插件 → ChatGPT 订阅 里点「绑定 ChatGPT 账号」。"
echo "  （桌面端客户端请在「插件 → 添加插件」里填 $REPO_URL）"
echo "  验证：dsh --profile $PROFILE --dump-config | grep dsh-chatgpt-sub"
echo "  卸载：./uninstall.sh --profile $PROFILE"
