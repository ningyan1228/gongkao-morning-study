import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const ALLOWED_HOSTS = new Set([
  "www.news.cn",
  "news.cn",
  "www.people.com.cn",
  "people.com.cn",
  "www.gmw.cn",
  "gmw.cn",
  "www.gov.cn",
  "gov.cn",
]);

serve(async (request) => {
  const requestUrl = new URL(request.url);
  const target = requestUrl.searchParams.get("url");

  if (!target) {
    return json({ error: "Missing url query parameter" }, 400);
  }

  let feedUrl: URL;
  try {
    feedUrl = new URL(target);
  } catch {
    return json({ error: "Invalid url" }, 400);
  }

  if (!ALLOWED_HOSTS.has(feedUrl.hostname)) {
    return json({ error: "Feed host is not allowed" }, 403);
  }

  const response = await fetch(feedUrl, {
    headers: {
      "user-agent": "gongkao-morning-study/1.0",
    },
  });

  if (!response.ok) {
    return json({ error: `Feed request failed: ${response.status}` }, 502);
  }

  return new Response(await response.text(), {
    headers: {
      "access-control-allow-origin": "*",
      "cache-control": "public, max-age=900",
      "content-type": "application/xml; charset=utf-8",
    },
  });
});

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "access-control-allow-origin": "*",
      "content-type": "application/json; charset=utf-8",
    },
  });
}
