# 公考早自习

一个零服务器、零数据库、低成本运行的公考/考编早自习工具。网站部署在 GitHub Pages，实时新闻由 Netlify 免费 Functions 代理抓取，用户自己的打卡、素材、作答记录保存在浏览器 localStorage。

## 已实现功能

- 每日早读卡：今日热点、申论角度、可背金句、规范表达、每日小题
- 实时新闻：Netlify Function 自动抓取新华网、人民网观点、光明网理论、中国政府网要闻
- 申论素材自动归档：一键把今日热点沉淀为素材卡
- 早自习流程：晨读 5 分钟、背 3 个表达、做 1 道小题、打卡留痕
- 考试模式：公务员、事业编、教师编、医疗编
- 分享打卡图：浏览器 Canvas 生成 PNG，不需要服务器
- 本地学习数据：localStorage 保存打卡、收藏、答案、素材库
- 数据备份：导出 / 导入 JSON，换电脑也能迁移
- 专注计时：30 / 45 / 60 分钟

## 零成本架构

```text
GitHub Pages
  负责静态页面展示

Netlify Functions 免费额度
  负责实时抓取公开新闻页面

浏览器 localStorage
  保存个人学习数据

导出 / 导入 JSON
  替代账号系统和数据库同步
```

## 本地预览

由于项目使用 ES Modules，建议用本地静态服务器打开：

```bash
python -m http.server 8080
```

然后访问 `http://localhost:8080`。

## 部署到 GitHub Pages

1. 上传根目录静态文件到 GitHub 仓库。
2. 在仓库 `Settings -> Pages` 中选择 `Deploy from a branch`。
3. 分支选择 `main`，目录选择 `/root`。
4. 保存后等待 Pages 构建完成。

## 部署 Netlify 新闻代理

把同一个 GitHub 仓库导入 Netlify 即可。`netlify.toml` 已配置：

```toml
[build]
  publish = "."
  functions = "netlify/functions"
```

前端已经在 `modules/news.js` 中设置为你的 Netlify 函数地址：

```js
const PROXY_BASE = "https://gongkao-morning-study-zhiwu-20260626.netlify.app/api/rss";
```

如果你换了 Netlify 站点，只需要改这一行。

## 不要上传

不要上传 `.netlify/` 目录，它只是本地部署缓存，已经写进 `.gitignore`。