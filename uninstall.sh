#!/usr/bin/env bash
# dsh-chatgpt-subscription — 一键卸载脚本
# 用法：./uninstall.sh [--profile <name>]
# 清理范围（本插件添加的内容）：profile 里的插件条目 + openai-codex 路由配置 +
# OPENAI_CODEX_API_KEY 凭据 + 绑定标记目录。
# 保留：~/.codex/auth.json（codex CLI 自己的登录态，绝不删除）。
set -euo pipefail

PROFILE="web"
while [[ $# -gt 0 ]]; do
  case "$1" in
    --profile) PROFILE="$2"; shift 2 ;;
    -h|--help) echo "用法: ./uninstall.sh [--profile <name>]"; exit 0 ;;
    *) echo "未知参数: $1"; exit 1 ;;
  esac
done

command -v dsh >/dev/null 2>&1 || { echo "错误：未找到 dsh CLI"; exit 1; }

echo "==> 从 profile '$PROFILE' 卸载 dsh-chatgpt-subscription"
if ! dsh plugin --profile "$PROFILE" remove dsh-chatgpt-subscription; then
  echo "  ⚠ 插件移除失败（可能已卸载或 profile 不存在），继续清理配置。"
fi

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "==> 清理 openai-codex 路由配置与 OPENAI_CODEX_API_KEY 凭据"
if command -v python3 >/dev/null 2>&1; then
  python3 "$ROOT/scripts/purge-codex.py"
else
  echo "⚠ 未找到 python3，无法自动清理。请手动操作："
  echo "  1) 删除 ~/.dsh/settings.yaml 中的 llm-pi-ai.providers.openai-codex 段"
  echo "  2) 删除 ~/.dsh/.credentials.yaml 中的 OPENAI_CODEX_API_KEY 行"
fi

echo "==> 清理绑定标记目录（~/.dsh/dsh-chatgpt-subscription/）"
DATA_DIR="${DSH_CHATGPT_DATA_DIR:-$HOME/.dsh/dsh-chatgpt-subscription}"
DEFAULT_DATA_DIR="$HOME/.dsh/dsh-chatgpt-subscription"
case "$DATA_DIR" in
  "$DEFAULT_DATA_DIR"|"$DEFAULT_DATA_DIR"/*) ;;
  *) echo "错误：拒绝删除不在默认插件目录内的 DSH_CHATGPT_DATA_DIR：$DATA_DIR"; exit 1 ;;
esac
if [[ "$DATA_DIR" == "/" || "$DATA_DIR" == "$HOME" || -z "$DATA_DIR" ]]; then
  echo "错误：拒绝删除危险路径"; exit 1
fi
rm -rf -- "$DATA_DIR"

echo
echo "✔ 卸载完成。"
echo "  ⚠ 运行中的 DeepSeek Harness 把配置/凭据保存在内存里——请重启 dsh $PROFILE 使清理生效。"
echo "  ~/.codex/auth.json（codex CLI 自己的登录态）已保留，未做任何改动。"
echo "  下一步：重启 DeepSeek Harness（dsh $PROFILE），模型切换器中的 ChatGPT 提供商自动消失。"
