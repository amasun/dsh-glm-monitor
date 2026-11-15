# GLM Monitor

在 DeepSeek Harness Web GUI 的右侧栏查看智谱 AI (BigModel) 订阅套餐用量与剩余额度。

## 功能

- 右侧栏新增「GLM 用量」页签：在右侧栏引导页（More tools / 引导卡片）点击打开。
- **配额限制**
  - Token 用量（5 小时窗口）：进度条 + 百分比 + 重置倒计时（绿 < 70% / 黄 70–89% / 红 ≥ 90%）。
  - MCP / 工具用量（月度）：进度条 + 各工具用量明细。
- **模型调用量**：总调用次数、总 Token 消耗（24 小时 / 7 天 / 30 天切换）。
- **工具调用量**：网络搜索、网页读取、ZRead、Search MCP 及明细。
- 每 10 分钟自动刷新，也可手动刷新。

## 设置

打开右侧栏「GLM 用量」页签，在未设置 Key 的界面粘贴智谱 AI API Key（[获取地址](https://open.bigmodel.cn/usercenter/apikeys)）并保存。Key 保存在 profile 配置的 glm-monitor 条目中，可随时再次保存覆盖。

## 数据来源

插件 Host 端注册同源路由 `/glm-monitor/usage`，代为调用以下开放平台接口，API Key 不进入浏览器：

- `/api/monitor/usage/quota/limit`
- `/api/monitor/usage/model-usage`
- `/api/monitor/usage/tool-usage`

## 已知限制

- 未实现模型测速（参考 VS Code 扩展 glm-monitor 的后续可加功能）。
- 查询范围为本地时区时间。
