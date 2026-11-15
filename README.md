# GLM Monitor — DeepSeek Harness 右侧栏插件

在 DeepSeek Harness Web GUI 的右侧栏查看智谱 AI (BigModel) 订阅套餐用量与剩余额度。参考 [glm-monitor (VS Code)](https://github.com/LaughSmiles/glm-key-monitor) 的功能与 API 用法，适配为 DSH bundle 插件。

![icon](dsh-glm-monitor/icon.svg)

## 功能

- 右侧栏新增「GLM 用量」页签：在右侧栏引导页（More tools / 引导卡片）点击打开。
- **配额限制**
  - Token 用量（5 小时窗口）：进度条 + 百分比 + 重置倒计时（绿 < 70% / 黄 70–89% / 红 ≥ 90%）。
  - MCP / 工具用量（月度）：进度条 + 各工具用量明细。
- **模型调用量**：总调用次数、总 Token 消耗（24 小时 / 7 天 / 30 天切换）。
- **工具调用量**：网络搜索、网页读取、ZRead、Search MCP 及明细。
- 每 10 分钟自动刷新，也可手动刷新。

## 安装

1. 解压本压缩包，得到 `dsh-glm-monitor/` 目录。
2. 打开 DeepSeek Harness Web GUI → **Plugins** → **Add plugin**，选择该目录安装并启用。
3. 重启 DeepSeek Harness（首次安装需要，之后改 Key 无需重启）。
4. 刷新页面，在右侧栏引导页点击「GLM 用量」打开面板。
5. 首次使用：在面板的输入框粘贴智谱 AI API Key（[获取地址](https://open.bigmodel.cn/usercenter/apikeys)）→ 保存，即可看到用量。

## 数据与安全

- Key 保存在 DSH 的**凭据存储**（credentials，`GLM_MONITOR_API_KEY`）中，不写入任何配置文件；换 Key 立即生效。
- API Key 只在 Host（本机进程）侧使用。插件注册同源路由 `/glm-monitor/usage`，由 Host 代理调用以下接口，浏览器永不接触 Key：
  - `https://open.bigmodel.cn/api/monitor/usage/quota/limit`
  - `https://open.bigmodel.cn/api/monitor/usage/model-usage`
  - `https://open.bigmodel.cn/api/monitor/usage/tool-usage`

## 文件结构

```
dsh-glm-monitor/
├── package.json          # bundle 清单（dsh.bundle.patch + dsh.client）
├── cordis.patch.yml      # 插入插件行 glm-monitor
├── index.js              # Host 端：同源代理路由 + Key 凭据存取
├── client.js             # 浏览器端：右侧栏页签类型注册 + 用量面板
├── icon.svg              # 插件图标
├── locale/{zh,en}.json   # 插件名称与描述（双语）
└── docs/DETAIL.md        # Plugins 详情页文档
```

## 已知限制

- 未实现模型测速（原 VS Code 扩展有此功能）。
- 查询范围为本地时区时间。
- 插件行不支持 configEditor 表单编辑，改 Key 请在面板内操作。

## License

MIT
