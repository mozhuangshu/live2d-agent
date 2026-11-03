# 从一张图片制作角色与表情

仓库现在包含可由 Agent 使用的技能：`.agents/skills/single-image-avatar/SKILL.md`。支持两条明确不同的路径。

## A. 真正的 Live2D `.moc3` 工作流（提供技能指引，完整构建尚未验收）

本项目通过固定版本链接接入 [bellisji233/live2d-halfbody-skill](https://github.com/bellisji233/live2d-halfbody-skill/tree/78b0be9674884d5b3834ba438cf5997347525773)，不复制上游源码、历史用户叙事、示例人物、第三方 patch、Core 或模型权重。技能提供步骤、授权边界与离线预检；使用者需另外取得并审查上游代码。`scripts/live2d-source.json` 记录固定提交的 Python 源文件、依赖清单及两份 MIT 许可文件校验和，不代表完整安全审计或第三方许可审查。

它包含多张变体生成、拆层、网格与绑定、`.moc3` 序列化、四种表情及 VTube Studio 包装。**单图是流程起点，不代表无需其他素材/模型的一步离线转换。** 输出不是 Cubism Editor 工程 `.cmo3`，也不是官方编译器产物。当前网页没有 Cubism 加载器，真实模型应在授权 Cubism Runtime / VTS 中测试。

先运行完全离线、不执行上游代码的检查：

```sh
python3 scripts/check-live2d.py
# 已另行取得固定版本源码时，可校验关键文件（不执行）：
python3 scripts/check-live2d.py --upstream /path/to/live2d-halfbody-skill
```

不传路径时返回可发现依赖；传路径时另做选定文件完整性与 AST 语法检查。它不读取令牌、不加载动态库、不上传图片，不代表构建通过。上游 Python 依赖为 NumPy、OpenCV、Pillow、gradio_client 和 psd-tools；建议单独虚拟环境，按目标系统选择版本并固定依赖。完整执行还需要：

- 用户认可的正面立绘，以及图像编辑模型生成/用户提供的对齐变体。
- See-through 的合适分层结果。默认优先用户已有 PSD，或另行安装的本地 See-through；本仓库不附带权重。
- 官方渠道、符合使用许可的 Cubism Core，用于加载和预览验证。
- 目标系统中的 VTube Studio 做最终验收。作者的既往测试不代表你的系统已验证。

**执行前阅读技能的授权和隐私边界。** 上游 `rigkit.variants` 可能调用云端图像生成；`rigkit.seethrough fetch` 默认连接外部服务且可能换站。不要将这两个命令当作离线步骤运行。图像外传必须先说明图片、服务与目的并取得批准；本地失败不能静默改为云端。第三方源代码执行、SDK 条款、凭据和安装各自遵守所在 Agent 的确认要求。

获准执行上游代码、且已具备本地素材和依赖后，参考命令如下（从仓库根目录设置绝对 PYTHONPATH，然后在私有工作目录运行）：

```sh
export PYTHONPATH="/absolute/path/to/reviewed/live2d-halfbody-skill"
mkdir -p private/live2d-work
cd private/live2d-work
# 先按 上游 SKILL.md 准备 素材/角色名/ 的变体与分层；不是只放原图。
python -m rigkit.estimate 素材/角色名/layers-st 角色/角色名 --name 角色名
python -m rigkit.check_art 角色/角色名/character.json
python -m rigkit.prepare 角色/角色名/character.json
python -m rigkit.build 角色/角色名/character.json
python -m rigkit.preview flips 角色/角色名/build/runtime
python -m rigkit.preview sheet 角色/角色名/character.json 角色/角色名/自查 新版=角色/角色名/build/runtime
```

完整步骤和各步骤输入在 [上游 SKILL.md](https://github.com/bellisji233/live2d-halfbody-skill/blob/78b0be9674884d5b3834ba438cf5997347525773/SKILL.md)。其中的外传或安装操作不是自动授权。上游 split/VTS 包装包含删除或覆盖目标目录的行为；只能使用核实过路径的新工作目录，不可对既有用户模型运行默认覆盖。显式指定已授权的 Core 路径，避免自动查找并加载来历不明的动态库。生成后检查闭嘴、眨眼、四个表情、左右转头和遮挡边界，实测目标 Runtime，再单独决定是否安装到 VTS。本次集成只对已有固定版本暂存源码验证选定文件完整性和语法，**未执行上游代码、未生成或验收 `.moc3`，没有上传任何图片**。

## B. 本地轻量原型：`.avatar.json`（可以直接运行）

适合清晰正面、单个人物、无遮挡的插画。依赖 Python 3 + Pillow；网页仍只需要 Node 20+，无需 npm 包。Pillow 可在独立虚拟环境中从 PyPI 安装。生成过程只读本地图片，不联网；保留原图，重新编码 PNG 并丢弃 EXIF/ICC 元数据。

```sh
python3 scripts/create-avatar.py /path/to/portrait.png --out private/avatar-v1 --name "My host"
```

输出：

- `character.avatar.json`：内嵌 PNG、尺寸、五个特征区域和补底颜色，直接导入网页。
- `landmarks.json`：归一化 `[x,y,width,height]`，坐标基于已应用 EXIF 方向后的图片，左上角为原点。
- `calibration.png`：框选眼、眉、嘴的位置。**默认位置是猜测，不是人脸检测，必须检查。**

查看标注图，把五个框改到对应的眼、眉、嘴边缘，不包含头发；框互不重叠。然后：

```sh
python3 scripts/create-avatar.py /path/to/portrait.png --landmarks private/avatar-v1/landmarks.json --out private/avatar-v2 --name "My host"
npm start
```

在网页「本地单图角色包」选择 v2 的 `character.avatar.json`。通过已有六种表情、稿件、系统 TTS/本地音频/静默播放控制，或同页 Agent 调用：

```js
await window.avatarAgent.loadAvatar(pack); // pack 是已在本地读取的 JSON 对象，不是 URL
window.avatarAgent.setExpression('smile', 0.8);
await window.avatarAgent.play({mode:'silent'});
```

口型由既有播放器驱动，与表情叠加；恢复 Lumi 按钮取消未完成的角色解码。导入不执行角色包代码，也不加载远程资源。包包含原图像素，依然是私人素材，不应公开提交。

**效果边界：** 这是 Canvas 图像木偶，不是 Live2D：眼睛局部压缩模拟眨眼，眉毛局部旋转，嘴巴为程序化图形；仅有整图轻微浮动。没有神经生成、自动分层、隐藏区域补全、真实转头、发丝物理或精确唇音。背景/皮肤不均匀、照片、遮挡和错位框可能出现矩形接缝。补底色可在角色包 `features.*.fill` 中手工调整。不要把原型称为高质量人物还原或 Cubism 模型。

文件限制：静态 PNG/JPEG/WebP，不超过 20 MiB / 1600 万像素；最长边缩放到 1536，缩放后任一边不足 64 像素的极端长宽比会被拒绝。输出目录必须不存在，避免覆盖已有素材。建议先用合成图片测试，不使用用户图片做公开测试夹具。

## 验证

```sh
npm test
npm run check
npm run test:avatar
python3 scripts/check-live2d.py
```

Node 测试覆盖角色包白名单/坐标边界和六种表情参数；Python 测试通过合成图走真实 CLI、验证嵌入 PNG、元数据清理、校准和拒绝覆盖。上游检查只做哈希、语法和依赖可发现性，不能代替完整建模、Cubism Core 加载或 VTS 验收。


### 本次验证边界

本次增加功能后通过 22 项 Node 测试、5 项 Python 测试、JavaScript 语法与技能格式校验；固定版本的 27 个选定上游文件通过哈希核对，24 个 Python 文件通过 AST 解析，没有运行上游脚本。另用合成图片在本地 native Canvas 实际渲染六种表情并目视检查：默认框残留原嘴边缘，经校准框扩大后消除。这验证了必须校准，而非自动定位准确。

Chromium 浏览器冒烟测试尝试在页面打开前被环境的本地 socket 限制阻塞，尚未完成真实浏览器导入/重置/播放验收。native Canvas 渲染不替代浏览器验收；真人素材质量、真实音频及完整 Cubism/VTS 路径仍未验证。
