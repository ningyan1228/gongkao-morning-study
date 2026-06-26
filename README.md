# 公考早自习

一个可以直接部署到 GitHub Pages 的公考晨读工作台，包含专注计时、每日打卡、申论热点、金句库、素材库和每日一题。

## 功能

- GitHub Pages 纯静态运行，默认使用本地模拟热点数据
- 30 / 45 / 60 分钟专注计时
- `localStorage` 记录打卡、连续天数、累计时长、收藏和作答记录
- 申论化热点卡片：摘要、角度、金句、来源、主题
- 预留 Deno Deploy 与 Netlify Functions 两种 RSS 代理

## 本地预览

由于项目使用 ES Modules，建议用本地静态服务器打开：

```bash
python -m http.server 8080
```

然后访问 `http://localhost:8080`。

## 部署到 GitHub Pages

1. 新建 GitHub 仓库。
2. 上传本项目所有文件。
3. 在仓库 `Settings -> Pages` 中选择 `Deploy from a branch`。
4. 分支选择 `main`，目录选择 `/root`。
5. 保存后等待 Pages 构建完成。

## 启用 RSS 代理

### Deno Deploy

1. 在 Deno Deploy 新建项目。
2. 上传或连接 `api/deno-rss-proxy.ts`。
3. 获得部署地址后，在 `modules/news.js` 中设置：

```js
const PROXY_BASE = "https://your-deno-project.deno.dev";
```

### Netlify

1. 把项目导入 Netlify。
2. `netlify.toml` 已配置静态目录和函数目录。
3. `modules/news.js` 已默认设置为：

```js
const PROXY_BASE = "/api/rss";
```

## 下一步产品化

- V2：接入真实 RSS，自动生成每日申论题
- V3：接入 AI 申论批改、热点拆解和素材卡片生成
- V4：用户系统、云同步、订阅制

