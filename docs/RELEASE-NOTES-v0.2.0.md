# dsh-chatgpt-subscription v0.2.0

移除插件的「搜索模式管理」，回归纯订阅绑定定位。**搜索商由用户自己在 DSH 配置层指定**，插件不再自动切换搜索线路。

## 本次变更

- **删除搜索模式管理**：绑定/解绑/插件停用不再读取、改写或切换任何搜索配置（不再改动 `web-search-deepseek` 设置的凭据引用）
- **删除 3 秒搜索线路轮询**：模型选择不再联动搜索可用性
- **搜索商用户自管**：`searchProvider`（如 `deepseek-official` / `exa`）完全由用户在 profile 配置层配置；ChatGPT 订阅令牌仍绝不会被当作搜索凭据
- **文档与测试同步**：70 项自动化测试全绿；INSTALL / 技术设计 / 产品定义 / 审计文档更新

## 为什么

用户拍板：联网搜索是独立的辅助能力，应完全由用户显式配置（如接入 Exa 等第三方搜索商），不随聊天模型自动切换；插件只负责 ChatGPT 订阅的官方 OAuth 绑定、令牌看护与模型路由。

## 安装升级

```bash
cd dsh-chatgpt-subscription
git pull
./install.sh        # 或 dsh plugin --profile web add .
# 重启 dsh web 生效
```

## 已知限制

- 搜索是否可用、用哪家搜索商，取决于用户在 DSH 的搜索配置（与本插件无关）
- 真实端到端授权需用户首次绑定 ChatGPT 账号时自然验证
