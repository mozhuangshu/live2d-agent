# Avatar Studio

**Agent 驱动的虚拟主播读稿工作台。** 将文字、表情、语速和停顿编排为结构化脚本，让一个原创 2D 主持人顺序讲述。不依赖摄像头、人脸识别或云端账号。

> 默认角色为本项目原创的程序化 Canvas 2D 角色 **Lumi**，不是 Live2D Cubism 模型，仓库不含 `.moc3` / Cubism SDK。可以按渲染器接口接入持有合法许可的真实 Live2D 模型，但当前版本没有内置 Cubism 加载器。

## 快速开始

需要 Node.js 20+；不需要 npm 安装依赖。

```sh
npm start
```

打开 http://127.0.0.1:4173，点击「开始口播」。第一次播放须由浏览器用户手势触发，系统语音依操作系统及浏览器而异。

```sh
npm test
npm run check
```

也可将 `index.html` 和 `src/` 部署到任意静态服务器。不要直接双击 `file://` 打开 ES Modules 页面。

## 使用流程

1. 输入稿件，每段一行，点击「载入稿件」，或导入 Agent 输出的 JSON。
2. 选择段落，安排自然、微笑、大笑、认真、皱眉、愤怒六种表情。
3. 选择系统朗读、导入音频或静默预览。
4. 播放、暂停、继续和停止。纯净舞台可用于录屏/OBS 窗口采集，按 Escape 返回编辑器。
5. 导出 JSON 保存编排。文件可能含私人文案，请自行保管。

系统朗读声音可能为空或不支持中文；这时可换浏览器/声音，或使用本地音频。项目不生成、训练或克隆真实人物声音。

## 两种口型方案及边界

| 模式 | 驱动方式 | 真实限制 |
|---|---|---|
| 系统朗读 | SpeechSynthesis 开始/结束事件 + 节奏估算 | 浏览器不提供合成音频振幅和完整音素。不是精确唇音对齐，部分中文引擎不触发 word boundary。 |
| 导入音频 | Web Audio RMS 振幅 | 有声时开口、静音时闭口，不区分音素。字幕/表情按 JSON 时间轴，需匹配 durationMs 和 pauseMs。 |
| 静默预览 | 模拟节奏 | 没有声音，用于编排预览，不是音频同步。 |

表情控制嘴角/笑眼，语音控制嘴巴开合，两者独立叠加。不会为了持续大笑而强制嘴巴一直张开。

## Agent 接口

Agent 生成可验证的 JSON 数据，播放器执行白名单字段，不执行 Agent 提供的代码。没有内置 LLM API、不需要 API Key；你的 Agent 可以通过浏览器自动化、同页脚本调用，或显式开启本地 HTTP 控制。

```js
window.avatarAgent.load({
  version: 1,
  title: '产品发布口播',
  segments: [
    { text: '大家好，欢迎来到发布现场。', expression: 'smile', rate: 1, pauseMs: 400 },
    { text: '接下来，我们认真看一下这次更新。', expression: 'serious', rate: 0.95, pauseMs: 600 }
  ]
});
await window.avatarAgent.play({ mode: 'speech' });
```

需先由用户点击一次开始播放，遵守浏览器音频策略；不要用此接口绕过权限。`play` 返回播放启动状态，不是播放完成 Promise。监听 `avatar:state` 的 `ended` 表示完成。

独立 Agent 可启动本地桥接：

```sh
npm run agent
# 在浏览器打开 http://127.0.0.1:4173 后：
curl -X POST http://127.0.0.1:4173/api/commands \
  -H 'Content-Type: application/json' \
  -d '{"command":"run","script":{"version":1,"segments":[{"text":"你好，我现在由 Agent 驱动。","expression":"smile"}]},"options":{"mode":"silent"}}'
```

也可运行标准库 Python 示例，无需安装包：

```sh
python3 examples/agent_driver.py --mode silent
python3 examples/agent_driver.py --stop
```

`silent` 可自动验证控制链路；有声 `speech` 模式仍遵守浏览器用户手势要求。接口返回 202 表示交给已打开的主播页，不代表播放完成。关闭服务即结束本地控制，无持久凭据。纯静态部署没有本地 HTTP 接口。

完整 API、事件契约、运行示例和 schema 范围见 [docs/AGENT_API.md](docs/AGENT_API.md)。脚本示例见 [examples/welcome.json](examples/welcome.json)。

## 目录

- `src/core.mjs`：脚本验证、时间轴和口型数学函数
- `src/player.mjs`：TTS/音频/静默播放器及取消控制
- `src/avatar.mjs`：原创角色与 `setPose` 渲染器接口
- `src/app.mjs`：UI 和 Agent API
- `tests/`：数据边界、暂停/停止及迟到回调回归测试
- `scripts/serve.mjs`：默认只绑定回环地址的静态开发服务器（可选 Agent 控制）

## 隐私与安全

- 没有摄像头、麦克风权限，没有人脸模板或校准数据。
- 没有用户照片、真实姓名、邮箱、私有 Site 标识、API Key、连接凭据或旧项目 Git 历史。
- 角色由代码绘制，没有外部图片、字体或跟踪脚本。
- 稿件和本地音频不上传到本项目的服务器；音频仅通过内存 Object URL 使用。刷新页面清空稿件和音频。
- **系统 TTS 并非保证离线**：浏览器列为在线/未知的声音可能把文案交给操作系统或语音服务供应商。敏感稿件请选择本地声音或导入预生成音频；不确定时使用静默预览。
- 默认只提供当前页面 JavaScript API。显式运行 `npm run agent` 可开启仅回环地址的本地 HTTP 控制；它拒绝外部地址、跨来源和 DNS 重绑定请求，不接受可执行代码，不使用 `eval`。本地其他进程也能控制该端口，不要在不可信共享机器上启用。
- 用户自己添加的音频、角色与 SDK 不自动获得 MIT 许可，也不会自动上传进仓库。

## 许可与扩展

项目原创代码和程序化默认角色使用 MIT License。第三方 SDK、字体、角色、音频需单独遵守其许可证。真实 Live2D 接入建议实现以下接口，并按 Cubism 官方授权集成，不要把商业运行库或无权分发的模型提交到仓库：

```js
renderer.setPose({ expression: 'smile', intensity: 0.8, mouth: 0.3 });
```

后续可扩展离线 TTS 音素时间戳、真正的 viseme 对齐、合法 Cubism 适配器与视频导出。当前版本不包含这些功能，也不承诺广播级口型精度。
