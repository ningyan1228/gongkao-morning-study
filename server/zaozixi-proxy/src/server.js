const http = require("node:http");
const { URL } = require("node:url");

const port = Number(process.env.PORT || 3000);
const cacheTtlMs = Number(process.env.CACHE_TTL_SECONDS || 900) * 1000;

const defaultSources = [
  { name: "新华网时政", url: "https://www.news.cn/politics/index.html" },
  { name: "人民网观点", url: "https://opinion.people.com.cn/" },
  { name: "光明网理论", url: "https://theory.gmw.cn/" },
  { name: "中国政府网要闻", url: "https://www.gov.cn/yaowen/" },
];

const allowedHosts = new Set([
  "www.news.cn",
  "news.cn",
  "opinion.people.com.cn",
  "www.people.com.cn",
  "people.com.cn",
  "theory.gmw.cn",
  "www.gmw.cn",
  "gmw.cn",
  "www.gov.cn",
  "gov.cn",
]);

const memoryCache = new Map();

const server = http.createServer(async (request, response) => {
  try {
    const requestUrl = new URL(request.url, `http://${request.headers.host || "localhost"}`);

    if (request.method === "OPTIONS") {
      send(response, 204, "");
      return;
    }

    if (request.method !== "GET") {
      sendJson(response, 405, { error: "Method not allowed" });
      return;
    }

    if (requestUrl.pathname === "/" || requestUrl.pathname === "/health") {
      sendJson(response, 200, {
        ok: true,
        service: "zaozixi-proxy",
        time: new Date().toISOString(),
      });
      return;
    }

    if (requestUrl.pathname === "/api/rss" || requestUrl.pathname === "/rss") {
      const payload = await getNewsPayload(requestUrl);
      sendJson(response, 200, payload, {
        "cache-control": "public, max-age=900",
      });
      return;
    }

    sendJson(response, 404, { error: "Not found" });
  } catch (error) {
    sendJson(response, 500, {
      error: "Proxy failed",
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

server.listen(port, () => {
  console.log(`zaozixi-proxy listening on ${port}`);
});

async function getNewsPayload(requestUrl) {
  const cacheKey = requestUrl.searchParams.toString() || "default";
  const cached = memoryCache.get(cacheKey);
  if (cached && Date.now() - cached.createdAt < cacheTtlMs) {
    return { ...cached.payload, cached: true };
  }

  const target = requestUrl.searchParams.get("url");
  const limit = Math.min(Number(requestUrl.searchParams.get("limit") || 10), 20);
  const sources = target ? [{ name: "自定义来源", url: target }] : defaultSources;
  const settled = await Promise.allSettled(sources.map((source) => fetchSource(source)));
  const allItems = settled.flatMap((result) => (result.status === "fulfilled" ? result.value : []));
  const items = dedupeItems(allItems).slice(0, limit);
  const payload = {
    items,
    fetchedAt: new Date().toISOString(),
    sourceCount: sources.length,
    cached: false,
  };

  memoryCache.set(cacheKey, { createdAt: Date.now(), payload });
  return payload;
}

async function fetchSource(source) {
  let pageUrl;
  try {
    pageUrl = new URL(source.url);
  } catch {
    return [];
  }

  if (!allowedHosts.has(pageUrl.hostname)) return [];

  const response = await fetch(pageUrl, {
    headers: {
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "user-agent": "gongkao-morning-study/1.0",
    },
  });

  if (!response.ok) return [];

  const html = await response.text();
  return extractNewsItems(html, pageUrl, source.name);
}

function extractNewsItems(html, pageUrl, source) {
  const seen = new Set();
  const items = [];
  const anchorPattern = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;

  for (const match of html.matchAll(anchorPattern)) {
    const href = match[1];
    const title = cleanText(match[2]);
    if (!isUsefulTitle(title) || seen.has(title)) continue;

    let url;
    try {
      url = new URL(href, pageUrl);
    } catch {
      continue;
    }

    if (!["http:", "https:"].includes(url.protocol)) continue;
    if (!allowedHosts.has(url.hostname) && !url.hostname.endsWith("news.cn")) continue;

    seen.add(title);
    items.push({
      id: stableId(`${source}-${title}`),
      title,
      summary: `来自${source}的今日公开报道，可结合背景、举措、成效与启示整理为申论素材。`,
      source,
      url: url.toString(),
    });

    if (items.length >= 8) break;
  }

  return items;
}

function dedupeItems(items) {
  const seen = new Set();
  const unique = [];
  for (const item of items) {
    const key = item.title.replace(/\s/g, "");
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(item);
  }
  return unique;
}

function cleanText(value) {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function isUsefulTitle(title) {
  if (title.length < 8 || title.length > 44) return false;
  if (!/[\u4e00-\u9fa5]/.test(title)) return false;
  if (/首页|客户端|手机版|English|网站|关于|搜索|举报|专题|更多|视频|图片|直播|广告|登录|注册|版权|地方频道/.test(title)) return false;
  return true;
}

function stableId(input) {
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) >>> 0;
  }
  return `news-${hash.toString(16)}`;
}

function sendJson(response, statusCode, body, extraHeaders = {}) {
  send(response, statusCode, JSON.stringify(body), {
    "content-type": "application/json; charset=utf-8",
    ...extraHeaders,
  });
}

function send(response, statusCode, body, extraHeaders = {}) {
  response.writeHead(statusCode, {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET, OPTIONS",
    "access-control-allow-headers": "content-type",
    ...extraHeaders,
  });
  response.end(body);
}