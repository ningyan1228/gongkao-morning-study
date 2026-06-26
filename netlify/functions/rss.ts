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

const sourceNames: Record<string, string> = {
  "www.news.cn": "新华网",
  "news.cn": "新华网",
  "opinion.people.com.cn": "人民网观点",
  "www.people.com.cn": "人民网",
  "people.com.cn": "人民网",
  "theory.gmw.cn": "光明网理论",
  "www.gmw.cn": "光明网",
  "gmw.cn": "光明网",
  "www.gov.cn": "中国政府网",
  "gov.cn": "中国政府网",
};

export default async (request: Request) => {
  const requestUrl = new URL(request.url);
  const target = requestUrl.searchParams.get("url") ?? "https://www.news.cn/politics/index.html";

  let pageUrl: URL;
  try {
    pageUrl = new URL(target);
  } catch {
    return json({ error: "Invalid url" }, 400);
  }

  if (!allowedHosts.has(pageUrl.hostname)) {
    return json({ error: "News host is not allowed" }, 403);
  }

  const response = await fetch(pageUrl, {
    headers: {
      "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "user-agent": "gongkao-morning-study/1.0",
    },
  });

  if (!response.ok) {
    return json({ error: `Source request failed: ${response.status}` }, 502);
  }

  const html = await response.text();
  const items = extractNewsItems(html, pageUrl, sourceNames[pageUrl.hostname] ?? pageUrl.hostname);

  return json({ items, source: pageUrl.hostname, fetchedAt: new Date().toISOString() }, 200, {
    "cache-control": "public, max-age=900",
  });
};

export const config = {
  path: "/api/rss",
  method: ["GET"],
};

function extractNewsItems(html: string, pageUrl: URL, source: string) {
  const seen = new Set<string>();
  const items: Array<{ id: string; title: string; summary: string; source: string; url: string }> = [];
  const anchorPattern = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;

  for (const match of html.matchAll(anchorPattern)) {
    const href = match[1];
    const title = cleanText(match[2]);
    if (!isUsefulTitle(title) || seen.has(title)) continue;

    let url: URL;
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

function cleanText(value: string) {
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

function isUsefulTitle(title: string) {
  if (title.length < 8 || title.length > 42) return false;
  if (!/[\u4e00-\u9fa5]/.test(title)) return false;
  if (/首页|客户端|手机版|English|网站|关于|搜索|举报|专题|更多|视频|图片|直播/.test(title)) return false;
  return true;
}

function stableId(input: string) {
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) >>> 0;
  }
  return `news-${hash.toString(16)}`;
}

function json(body: unknown, status: number, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "access-control-allow-origin": "*",
      "content-type": "application/json; charset=utf-8",
      ...extraHeaders,
    },
  });
}