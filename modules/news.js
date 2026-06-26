import { mockNews } from "../data/mock-news.js";
import { sources } from "../data/sources.js";
import { readStats, writeStats } from "./storage.js";

const PROXY_BASE = "/api/rss";

export async function initNews() {
  renderSources();
  document.querySelector("#refreshNews").addEventListener("click", loadNews);
  await loadNews();
}

async function loadNews() {
  const list = document.querySelector("#newsList");
  list.innerHTML = '<p class="panel-note">正在整理今日热点...</p>';

  const items =
    location.hostname === "localhost" || location.hostname === "127.0.0.1"
      ? mockNews
      : await fetchLiveNews().catch(() => mockNews);
  renderNews(items.length ? items : mockNews);
}

async function fetchLiveNews() {
  const feedUrl = sources[0].feed;
  const response = await fetch(`${PROXY_BASE}?url=${encodeURIComponent(feedUrl)}`);
  if (!response.ok) throw new Error("News proxy failed");
  const payload = await response.json();
  return payload.items.map((item, index) => enrichNews(item, index));
}

function enrichNews(item, index) {
  const topic = inferTopic(item.title);
  return {
    id: item.id ?? `live-${index}`,
    title: item.title,
    summary: item.summary || `围绕“${item.title}”积累背景、问题、措施和启示，可作为今日申论热点素材。`,
    angle: topic.angle,
    quote: topic.quote,
    source: item.source ?? sources[0].name,
    topic: topic.name,
    url: item.url,
  };
}

function inferTopic(title) {
  if (/就业|民生|社保|养老|医疗/.test(title)) {
    return { name: "就业民生", angle: "保障和改善民生、兜牢基本底线", quote: "民生连着民心，民心凝聚民力。" };
  }
  if (/乡村|农业|农村|农民/.test(title)) {
    return { name: "乡村振兴", angle: "城乡融合发展、公共服务均等化", quote: "推进乡村全面振兴，关键在产业、人才与治理协同。" };
  }
  if (/数字|数据|政务|平台|智能/.test(title)) {
    return { name: "数字政府", angle: "数字赋能治理、提升服务效能", quote: "让数据多跑路，让群众少跑腿。" };
  }
  if (/教育|学校|学生|教师/.test(title)) {
    return { name: "教育公平", angle: "促进机会公平、优化公共资源配置", quote: "教育公平是社会公平的重要基础。" };
  }
  return { name: "时政热点", angle: "政策执行、治理效能、群众获得感", quote: "把宏观部署转化为群众可感可及的治理成效。" };
}

function renderSources() {
  document.querySelector("#sourceStrip").innerHTML = sources
    .map((source) => `<span>${source.name}</span>`)
    .join("");
}

function renderNews(items) {
  const stats = readStats();
  document.querySelector("#newsList").innerHTML = items
    .map((item) => {
      const active = stats.favorites.includes(item.id) ? " is-active" : "";
      const title = item.url ? `<a href="${item.url}" target="_blank" rel="noreferrer">${item.title}</a>` : item.title;
      return `
        <article class="news-card">
          <h3>${title}</h3>
          <p>${item.summary}</p>
          <p><strong>申论角度：</strong>${item.angle}</p>
          <p><strong>可用金句：</strong>${item.quote}</p>
          <div class="news-meta">
            <span class="news-tag">${item.topic}</span>
            <span class="news-tag">${item.source}</span>
            <button class="favorite-button${active}" type="button" data-favorite="${item.id}">
              ${active ? "已收藏" : "收藏"}
            </button>
          </div>
        </article>
      `;
    })
    .join("");

  document.querySelectorAll("[data-favorite]").forEach((button) => {
    button.addEventListener("click", () => toggleFavorite(button.dataset.favorite));
  });
}

function toggleFavorite(id) {
  const stats = readStats();
  stats.favorites = stats.favorites.includes(id)
    ? stats.favorites.filter((favoriteId) => favoriteId !== id)
    : [...stats.favorites, id];
  writeStats(stats);
  renderNews(mockNews);
}