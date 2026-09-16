# 贡献指南（Contributing）

感谢你考虑为本项目贡献！以下是指南，请先阅读再提交。

## 如何贡献

### 报告 Bug
- 先搜索 [Issues](https://github.com/SONGOAO25/dsh-chatgpt-subscription/issues) 是否已存在；
- 新建 Issue 时请包含：复现步骤、期望行为、实际行为、环境信息。

### 提出新功能
- 先在 Issues 中发起讨论，说明用途和场景，避免重复劳动；
- 讨论通过后再实现。

### 提交代码
1. Fork 本仓库并创建功能分支：`git checkout -b feature/xxx`
2. 遵循 [Conventional Commits](https://www.conventionalcommits.org/zh-hans/v1.0.0/) 提交规范：
   - `feat: 新功能`
   - `fix: 修复`
   - `docs: 文档`
   - `test: 测试`
   - `chore: 杂项`
3. 提交信息用英文或中文均可，但需清晰描述改动；
4. 通过 Pull Request 提交，描述清楚改动内容和验证方式。

## 开发环境

- 本项目是 DeepSeek Harness 的静态 bundle 插件；
- 主要文件结构：
  - `src/host.js` — host 半（OAuth 绑定流程、令牌看护、路由注册、RPC）
  - `src/client-bundle.js` — client 半（设置页「订阅」）
  - `scripts/build.mjs` — 构建脚本（`src/` → `lib/`）
  - `tests/` — 测试（`run-all.mjs` 入口）
- 构建与测试：
  ```bash
  npm run build      # 构建 lib/（lib/ 为构建产物，已提交以支持直接安装）
  node tests/run-all.mjs   # 全量测试
  ```
- 开发约定：修改 `src/` 后重新构建；测试必须全绿再提交；零密钥、零个人路径。

## 安全

发现安全漏洞请**不要公开提交 Issue**——请通过 GitHub **Private security advisory** 私下报告（仓库主页 → Security → Report a vulnerability），详见 [SECURITY.md](SECURITY.md)。
