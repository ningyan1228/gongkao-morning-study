# zaozixi-proxy

公考早自习实时新闻代理。它只负责抓取公开新闻页面并输出 JSON，不保存用户数据，不需要数据库。

## 部署位置

推荐放在腾讯云服务器：

```bash
~/projects/zaozixi-proxy
```

## 启动

```bash
cd ~/projects/zaozixi-proxy
docker compose up -d --build
```

## 停止

```bash
cd ~/projects/zaozixi-proxy
docker compose down
```

## 日志

```bash
cd ~/projects/zaozixi-proxy
docker compose logs -f
```

## 测试

DNS 生效并由 nginx-proxy/acme-companion 签好证书后：

```bash
curl https://zaozixi-api.gjsx.uno/health
curl "https://zaozixi-api.gjsx.uno/api/rss?limit=5"
```

## 路由

- `GET /health` 健康检查
- `GET /api/rss?limit=8` 聚合默认新闻源
- `GET /api/rss?url=官方页面地址&limit=8` 抓取指定白名单官方页面