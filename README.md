# TizzyQ's Microclimate Research Modeling Program

**TizzyQ's MRMP** · 微气候研究建模程序 · Windows 本地 Web 应用

**简体中文** · [English](README.en.md)

TizzyQ's MRMP is a local research tool for preparing satellite mosaics, reviewing building footprints, and generating CAD drawings and village massing models for microclimate and wind studies. [Read the English guide](README.en.md).

这是一个本地运行的研究前处理工具，面向“卫星影像 → 建筑轮廓 → CAD 核查 → 照片层高 → 村落白模”的工作流。HTML/JavaScript 前端负责地图与交互，Python 本地服务负责瓦片拼接、照片 EXIF 读取及 CAD/模型文件生成。

当前版本为 `0.3.0`。卫星影像生成的建筑候选轮廓需人工核查后再用于研究建模。

## 环境与启动

- 面向 Windows 10/11，已在 Python 3.11 环境验证。界面为简体中文。
- 从 GitHub 克隆仓库，或选择 **Code → Download ZIP** 后解压。在源码根目录安装依赖。

```powershell
python -m pip install -r requirements.txt
```

- 可安装 `opencv-python` 启用 OpenCV 屋顶候选识别。未安装时仍可使用 NumPy 简化识别和手工描边。
- 地图瓦片、高清拼图下载和 OSM 查询需要网络。前端绘图库随源码提供，保存在 `static/vendor/`。

双击 `start.bat`，稍等约 2 秒，浏览器会打开：

`http://127.0.0.1:8765`

本地服务窗口需保持开启。按 `Ctrl+C` 停止。

也可手动启动：

```powershell
python app.py --host 127.0.0.1 --port 8765
```

打开浏览器访问 <http://127.0.0.1:8765>。默认配置只监听本机回环地址。首次启动会创建 `data/projects`、`data/exports` 和 `data/jobs`。若端口已被占用，可用 `--port` 指定其他端口并访问对应地址。

GitHub 的 **Download ZIP** 提供源码。已有 Windows 便携版的用户可按[便携版使用说明](便携版使用说明.txt)启动。仓库提供 `TizzyQ-Microclimate-Portable.spec`，可在已安装项目依赖和 PyInstaller 的 Windows 环境中执行 `python -m PyInstaller TizzyQ-Microclimate-Portable.spec` 构建。使用时保留 `dist/TizzyQ-Microclimate-Portable/` 的完整目录，可将 `start.bat` 复制到 EXE 同级目录作为启动入口。

## 当前可用流程

1. 在 20 余种分组底图或自定义 XYZ 底图上定位并框选研究区域；研究框只画边线，不覆盖源影像颜色。
2. 选择 Z16–Z22 精度，系统逐张下载当前级别小瓦片再裁切拼接，不截取低清屏幕；同时生成原色无覆盖 PNG 和带比例尺/指北针展示 PNG。
3. 在矩形研究区内可再绘制异形村落边界；OSM 与影像候选识别只保留异形边界内的建筑，减少山体、农田和水域误判。
4. 地图可持续缩放并实时加载瓦片；超过拼图原生级别时自动隐藏静态拼图并显示更高等级的实时瓦片，已经绘制的矢量坐标不会随视图缩放改变。
5. 人工补画支持自由多边形、两点矩形和“局部平面正交”。局部平面由第一条边确定，可沿任意村落/建筑朝向绘制，不锁定地图 X/Y 轴；完成后可连续绘制下一栋。
6. 可给补画轮廓设置目标面积和容差。面积接近目标值时，系统以中心等比吸附到准确平方米数，同时保持原朝向、平行边和直角关系。
7. 对已核查建筑执行闭合、自交、短边和有效高度审计；逐栋修改东西/南北尺寸、层数、单层高度、总高度、分区与高度锁定。
8. 批量读取现场照片的 EXIF GPS，在地图上显示点位，按最近建筑关联，并导出 CSV/GeoJSON 点位表。
9. 工程会自动保存到本地项目库；也可把 `.tqproject.json` 工程保存到指定文件夹、从文件夹或单文件重新载入，并删除网页项目库中的指定工程。工程文件中的拼图 URL 是本地导出文件引用；迁移时应同时复制 `data/exports` 中对应影像。
10. 导出闭合 CAD 与分组村落白模。

## 导出标准

- 建筑 GeoJSON 使用 WGS84 经度和纬度。CAD 与模型以导出轮廓顶点的最小经度、最小纬度为原点，使用 **1:1 本地米制坐标**。1:100、1:200 等是 CAD 出图记录，几何维持 1:1。
- DXF、DWG、OBJ 和 FBX ASCII 可按 1 m、0.1 m、0.01 m 或 0.001 m 输出，默认 0.1 m。当前 SketchUp 原生 SKP 和 FBX 路径使用 0.1 m。这里的精度指坐标舍入间隔，影像及实测数据的误差需要另行评估。
- DXF 中每栋建筑为闭合多段线，按分区和来源写入 `BLDG_*_MANUAL`、`BLDG_*_AI` 或 `BLDG_*_OSM` 图层。SketchUp 白模按 `TizzyQ_Buildings_1to1m → 分区组 → 来源组 → 单栋组` 组织。
- 界面的建议单层高度初始值为 3.0 m，可根据现场照片或实测数据逐栋修正。锁定总高度后，批量层高和照片回写会保留该栋高度。
- PNG、GeoJSON、DXF、OBJ 和 FBX ASCII 无需商业软件。DWG 转换需要本机 AutoCAD Core Console。原生 SKP 需要 SketchUp，FBX 优先调用 SketchUp，调用失败时回退到 FBX ASCII 7.4。

## 精度与研究边界

树冠、棚顶和道路高光可能被影像预描边识别为建筑。界面只导出标记为“已核查”且通过几何审计的建筑轮廓。用于风环境模拟前应重点检查以下内容。

- 建筑是否缺失或把相邻建筑误合并；
- 建筑外轮廓是否闭合；
- 底图与矢量是否采用同一坐标系；
- 层数和层高是否来自现场照片或人工记录；
- 高德底图在中国境内采用 GCJ-02，不能直接与 WGS84 矢量混用。

## 地图许可

瓦片影像和地图数据遵循各服务的许可与署名要求。正式研究成果请使用你有权下载和再利用的数据源，界面也支持配置授权的 HTTPS XYZ 瓦片服务。

软件会拒绝低方差的“暂无影像”占位瓦片。若底图在浏览器可见，但本地 Python 无法连接该服务或下载瓦片，请切换到可访问的授权数据源。

## 仓库结构与数据边界

| 路径 | 内容 |
| --- | --- |
| `app.py` | 本地 HTTP 服务、瓦片拼接、几何校验与导出 |
| `static/` | HTML、CSS、JavaScript 及本地 Leaflet 资源 |
| `smoke_test.py` | 几何与导出冒烟测试 |
| `start.bat` | Windows 源码版启动入口 |
| `data/` | 本机工程、导出、照片处理结果；由程序创建，**不提交到 Git** |
| `AAA-打包/` | 本地便携版与压缩包；**不提交到 Git** |

本仓库只发布程序源码和必要的前端依赖。研究工程、带 GPS 的现场资料、卫星拼图以及生成的 CAD/模型文件保留在使用者本机。

## 验证与贡献

```powershell
python -m py_compile app.py
python smoke_test.py
node --check static/app.js
powershell -NoProfile -ExecutionPolicy Bypass -File launcher_test.ps1
```

欢迎通过 Issue 报告问题。请提供复现步骤、程序版本和错误信息；提交前删除日志、截图或示例工程中的精确 GPS、现场照片与个人信息。改动请用 Pull Request 提交，并说明运行过的验证命令。

## 许可证

程序原创代码使用 [MIT License](LICENSE)。内置 Leaflet 与 Leaflet.draw 的许可证和署名见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。地图影像与地图数据遵循各自提供方的许可条款，不随本程序源码授权。
