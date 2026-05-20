# TokenScope

> Local-first desktop analytics for AI coding assistant token usage, cache reads, and estimated cost.  
> 面向 AI 编程助手的本地优先 Token 用量、缓存读取与消费额度分析桌面工具。

<p align="center">
  <img alt="platform" src="https://img.shields.io/badge/platform-Tauri%202-24c8db">
  <img alt="frontend" src="https://img.shields.io/badge/frontend-React%2019-61dafb">
  <img alt="language" src="https://img.shields.io/badge/language-TypeScript%20%2B%20Rust-7c3aed">
  <img alt="license" src="https://img.shields.io/badge/license-MIT-black">
</p>

TokenScope is a desktop app for turning local AI coding session logs into a clear, searchable, and exportable usage dashboard.  
TokenScope 是一个桌面应用，用来把本机 AI 编程会话日志整理成清晰、可检索、可导出的可视化面板。

It reads local logs from tools like **Claude Code**, **Kimi Code**, and **Codex**, then helps you answer questions like:  
它会读取 **Claude Code**、**Kimi Code**、**Codex** 等工具的本地日志，帮助你快速回答这些问题：

- How many tokens did I use today? / 我今天用了多少 Token？
- Which model or tool consumed the most? / 哪个模型或工具消耗最多？
- Which sessions were the most expensive? / 哪些会话最贵？
- When was usage concentrated? / 使用主要集中在哪些时段？
- How much cache read usage contributed to the total? / 缓存读取在总量里占了多少？

No cloud account is required. No backend service is required. Your data stays local by default.  
不需要云端账号，不依赖后端服务，数据默认保留在本地。

---

## Why TokenScope / 为什么使用 TokenScope

TokenScope is built for people who want a fast way to understand AI coding usage without digging through raw JSONL logs.  
TokenScope 适合那些不想手动翻 JSONL 原始日志、但又想快速看清 AI 编程使用情况的人。

### What it gives you / 它能提供什么

- **Local-first analysis** — read logs locally, store results locally, export locally  
  **本地优先分析** —— 本地读取、本地存储、本地导出
- **Multi-source aggregation** — combine Claude Code, Kimi Code, and Codex usage in one place  
  **多来源聚合** —— Claude Code、Kimi Code、Codex 数据统一查看
- **Clear dashboards** — overview cards, trends, distributions, Top sessions, and session drill-down  
  **清晰面板展示** —— 概览卡片、趋势、分布、Top 会话、会话下钻
- **Desktop widget** — pin key stats on your desktop for quick glance monitoring  
  **桌面小组件** —— 核心指标常驻桌面，便于随时查看
- **Export support** — generate CSV / JSON / Excel outputs for reporting or archival  
  **导出支持** —— 支持 CSV / JSON / Excel，用于汇报或归档

---

## Screenshots / 截图预留

> The images will be added later, so the sections below intentionally keep clear placeholders.  
> 你后面会补图片，所以这里先保留清晰的占位符结构。

### Main dashboard / 主仪表盘

```md
![Dashboard](docs/assets/placeholders/dashboard-overview.png)
```

### Analytics view / 分析页

```md
![Analytics](docs/assets/placeholders/analytics-overview.png)
```

### Sessions view / 会话页

```md
![Sessions](docs/assets/placeholders/sessions-overview.png)
```

### Settings view / 设置页

```md
![Settings](docs/assets/placeholders/settings-overview.png)
```

### Desktop widget / 桌面小组件

```md
![Widget](docs/assets/placeholders/widget-overview.png)
```

---

## Features / 功能特性

### Overview dashboard / 仪表盘概览

Track core usage metrics at a glance.  
快速查看核心使用指标。

- 消费额度 / Estimated cost
- 总请求数 / Total requests
- 总 Tokens / Total tokens
- 输入 / 输出 / 缓存读取统计 / Input / Output / Cache read stats
- 趋势图与来源分布 / Trend and source distribution

### Analytics workspace / 分析工作台

Explore usage patterns in more detail.  
从更细粒度分析使用模式。

- 模型分布 / Model distribution
- 工具分布 / Source distribution
- Top 10 会话 / Top 10 sessions
- 时段分布 / Hourly distribution
- 累计消费额度 / Cumulative cost
- Token 流向 / Token flow
- 模型迁移趋势 / Model trend

### Session explorer / 会话浏览

Inspect usage at the session level.  
下钻到单个会话级别查看明细。

- 分页浏览会话 / Paginated session list
- 查看完整会话 ID / Full session ID display
- 查看会话明细 / Session detail records
- 跳转指定页码 / Jump to page

### Desktop widget / 桌面小组件

Keep lightweight usage stats always visible.  
让轻量级统计信息始终可见。

- TokenScope 标题 / TokenScope branding
- 消费额度 / 总 Tokens / 总请求数 / 缓存读取  
  Estimated cost / Total tokens / Total requests / Cache read
- 自动刷新 / Auto refresh
- 可拖拽 / 可锁定 / 可钉入桌面  
  Draggable / Lockable / Pin-to-desktop

---

## Supported data sources / 支持的数据源

| Tool | Local source | Notes |
|---|---|---|
| Claude Code | `~/.claude/projects/**/*.jsonl` | Reads usage from assistant/session records |
| Kimi Code | `~/.kimi/sessions/**/wire.jsonl` | Reads token data from status updates |
| Codex | `~/.codex/sessions/**/rollout-*.jsonl` | Parses session and token count events |

---

## How it works / 工作方式

```text
Local AI tool logs
  -> Rust parsers
  -> SQLite normalization and summaries
  -> React dashboard and widget
  -> CSV / JSON / Excel exports
```

```text
本地 AI 工具日志
  -> Rust 解析器
  -> SQLite 标准化与汇总
  -> React 仪表盘与小组件
  -> CSV / JSON / Excel 导出
```

### Tech stack / 技术栈

- **Desktop shell / 桌面壳层**: Tauri 2
- **Frontend / 前端**: React 19 + TypeScript + Vite 7
- **Styling / 样式**: Tailwind CSS 4
- **Charts / 图表**: ECharts 6
- **State / 状态管理**: Zustand
- **Database / 数据库**: SQLite + rusqlite
- **Backend / 后端**: Rust

---

## Quick start / 快速开始

### Requirements / 环境要求

- Node.js
- Rust
- Tauri prerequisites for your OS  
  对应系统所需的 Tauri 构建依赖

### Install / 安装依赖

```bash
npm install
```

### Run in development / 启动开发环境

```bash
npm run tauri dev
```

### Build / 构建应用

```bash
npm run tauri build
```

### Useful commands / 常用命令

```bash
npm run dev
npm run build
npm run test
npm run tauri dev
npm run tauri build
```

---

## Data and storage / 数据与存储

TokenScope reads local log files and writes normalized results into a local SQLite database.  
TokenScope 从本机日志文件读取数据，并将标准化结果写入本地 SQLite 数据库。

### Common Windows database path / Windows 常见数据库路径

```text
%APPDATA%/com.asus.token-cost-analyzer/token_analyzer.db
```

### Privacy model / 隐私模型

- No mandatory cloud sync  
  不强制云同步
- No hosted backend required  
  不依赖托管后端
- No local session logs uploaded by default  
  默认不上传本地会话日志
- No external account needed to use the app  
  不需要外部账号即可使用

> Estimated cost is for reference only. Final billing depends on each provider's official pricing and invoice rules.  
> 消费额度仅供参考，实际账单以各平台官方计费规则为准。

---

## Project structure / 项目结构

```text
token_cost_analyzer/
├─ src/                 # React pages, components, stores, utilities
├─ src-tauri/           # Tauri config, Rust backend, SQLite logic
├─ docs/                # Project documentation
├─ scripts/             # Build and helper scripts
├─ index.html           # Main app entry
├─ widget.html          # Widget entry
└─ README.md            # Project homepage
```

---

## README assets to fill later / 后续待补素材

You said the images will be added later, so these are the current placeholders to replace.  
你后面会补图片，所以这些是当前预留的占位路径。

- `docs/assets/placeholders/dashboard-overview.png`
- `docs/assets/placeholders/analytics-overview.png`
- `docs/assets/placeholders/sessions-overview.png`
- `docs/assets/placeholders/settings-overview.png`
- `docs/assets/placeholders/widget-overview.png`

Recommended final screenshot directory / 建议正式截图目录：

```text
docs/assets/screenshots/
```

Recommended file names / 建议命名：

- `dashboard-overview.png`
- `analytics-overview.png`
- `sessions-overview.png`
- `settings-overview.png`
- `widget-overview.png`

---

## Suggested next additions / 推荐后续补充

If you want this README to feel complete on GitHub, the next best additions are:  
如果你想让这份 README 在 GitHub 上更完整，建议下一步补这些：

1. Real screenshots / 真实截图
2. Download / Release section / 下载与发布说明
3. FAQ / 常见问题
4. Known limitations / 已知限制
5. Changelog / 更新日志

---

## License

MIT
