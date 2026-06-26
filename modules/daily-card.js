import { examModes, defaultMode } from "../data/exam-modes.js";
import { mockNews } from "../data/mock-news.js";
import { quotes } from "../data/quotes.js";
import { getLiveNewsItems } from "./news.js";
import { readStats, todayKey, writeStats } from "./storage.js";

const modeKey = "gongkao:mode";
const flowSteps = [
  { id: "read", name: "晨读 5 分钟", detail: "读热点标题、背景和申论角度" },
  { id: "express", name: "背 3 个表达", detail: "把规范句式读顺、记熟" },
  { id: "practice", name: "做 1 道小题", detail: "完成 100-200 字作答" },
  { id: "checkin", name: "打卡留痕", detail: "生成今日学习记录" },
];

export function initDailyCard() {
  renderModeButtons();
  renderDailyCard();
  document.querySelector("#saveDailyMaterial").addEventListener("click", saveDailyMaterial);
  document.querySelector("#shareDailyCard").addEventListener("click", createShareImage);
  window.addEventListener("gongkao:statschange", renderDailyCard);
  window.addEventListener("gongkao:newschange", renderDailyCard);
}

export function getCurrentModeKey() {
  return localStorage.getItem(modeKey) || defaultMode;
}

export function getDailyPlan() {
  const modeId = getCurrentModeKey();
  const mode = examModes[modeId] || examModes[defaultMode];
  const daySeed = Number(todayKey().replaceAll("-", ""));
  const liveNews = getLiveNewsItems();
  const newsPool = liveNews.length ? liveNews : mockNews;
  const news = newsPool[daySeed % newsPool.length];
  const focus = inferFocus(news.title, mode.focusAreas, daySeed);
  const dailyQuotes = [quotes[daySeed % quotes.length], mode.expressions[0], mode.expressions[1]];

  return {
    modeId,
    mode,
    news,
    focus,
    quotes: dailyQuotes,
    question: mode.question,
  };
}

function renderModeButtons() {
  const active = getCurrentModeKey();
  document.querySelector("#modeButtons").innerHTML = Object.entries(examModes)
    .map(([id, mode]) => `<button class="${id === active ? "is-active" : ""}" type="button" data-mode="${id}">${mode.name}</button>`)
    .join("");

  document.querySelectorAll("[data-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      localStorage.setItem(modeKey, button.dataset.mode);
      renderModeButtons();
      renderDailyCard();
      window.dispatchEvent(new CustomEvent("gongkao:modechange"));
    });
  });
}

function renderDailyCard() {
  const plan = getDailyPlan();
  const stats = readStats();
  const today = todayKey();
  const completed = stats.progress[today] || [];

  document.querySelector("#dailyCard").innerHTML = `
    <article>
      <span class="news-tag">${plan.mode.label}</span>
      <h3>${plan.focus}</h3>
      <p>${plan.mode.goal}</p>
    </article>
    <article>
      <span class="news-tag">今日热点</span>
      <h3>${plan.news.title}</h3>
      <p>${plan.news.summary}</p>
    </article>
    <article>
      <span class="news-tag">申论角度</span>
      <h3>${plan.news.angle}</h3>
      <p>${plan.question}</p>
    </article>
    <article>
      <span class="news-tag">可背表达</span>
      <ul>${plan.quotes.map((quote) => `<li>${quote}</li>`).join("")}</ul>
    </article>
  `;

  document.querySelector("#studyFlow").innerHTML = flowSteps
    .map((step, index) => {
      const done = completed.includes(step.id) ? " is-done" : "";
      return `
        <button class="flow-step${done}" type="button" data-step="${step.id}">
          <strong>${index + 1}. ${step.name}</strong>
          <span>${step.detail}</span>
        </button>
      `;
    })
    .join("");

  document.querySelectorAll("[data-step]").forEach((button) => {
    button.addEventListener("click", () => toggleStep(button.dataset.step));
  });
}

function inferFocus(title, focusAreas, daySeed) {
  if (/就业|民生|社保|养老|医疗/.test(title) && focusAreas.includes("就业民生")) return "就业民生";
  if (/乡村|农业|农村|农民/.test(title) && focusAreas.includes("乡村振兴")) return "乡村振兴";
  if (/数字|数据|政务|平台|智能/.test(title) && focusAreas.includes("数字政府")) return "数字政府";
  if (/教育|学校|学生|教师/.test(title) && focusAreas.includes("教育公平")) return "教育公平";
  return focusAreas[daySeed % focusAreas.length];
}

function toggleStep(stepId) {
  const stats = readStats();
  const today = todayKey();
  const completed = new Set(stats.progress[today] || []);
  if (completed.has(stepId)) completed.delete(stepId);
  else completed.add(stepId);
  stats.progress[today] = [...completed];
  writeStats(stats);
  renderDailyCard();
}

function saveDailyMaterial() {
  const plan = getDailyPlan();
  const stats = readStats();
  const id = `${todayKey()}-${plan.modeId}-${plan.news.id}`;
  if (!stats.archive.some((item) => item.id === id)) {
    stats.archive = [
      {
        id,
        date: todayKey(),
        mode: plan.mode.name,
        topic: plan.focus,
        title: plan.news.title,
        problem: inferProblem(plan.focus),
        measure: plan.news.summary,
        meaning: plan.news.angle,
        expression: plan.quotes[1],
      },
      ...stats.archive,
    ];
    writeStats(stats);
  }
  window.dispatchEvent(new CustomEvent("gongkao:archivechange"));
}

function inferProblem(topic) {
  const map = {
    基层治理: "基层事务多元复杂，治理力量协同和服务触达仍需加强。",
    数字政府: "数据壁垒、流程分散和数字鸿沟会影响公共服务体验。",
    就业民生: "重点群体就业压力、技能适配和服务供给仍需精准发力。",
    乡村振兴: "乡村产业、人才和公共服务短板仍需持续补齐。",
    教育公平: "优质教育资源配置不均衡，学生发展机会仍需进一步保障。",
  };
  return map[topic] || "公共服务、治理协同或资源配置仍有优化空间。";
}

function createShareImage() {
  const plan = getDailyPlan();
  const stats = readStats();
  const canvas = document.createElement("canvas");
  canvas.width = 900;
  canvas.height = 1200;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#f6f7f9";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#ffffff";
  roundRect(ctx, 70, 70, 760, 1060, 28);
  ctx.fill();

  ctx.fillStyle = "#1f6f5b";
  ctx.font = "700 34px Microsoft YaHei, sans-serif";
  ctx.fillText("公考早自习打卡", 120, 150);
  ctx.font = "600 24px Microsoft YaHei, sans-serif";
  ctx.fillText(`${plan.mode.name} · ${todayKey()}`, 120, 198);

  ctx.fillStyle = "#18221f";
  ctx.font = "800 46px Microsoft YaHei, sans-serif";
  wrapText(ctx, plan.focus, 120, 300, 660, 58);

  ctx.font = "600 28px Microsoft YaHei, sans-serif";
  wrapText(ctx, plan.news.title, 120, 430, 660, 42);
  ctx.fillStyle = "#66706d";
  ctx.font = "24px Microsoft YaHei, sans-serif";
  wrapText(ctx, plan.news.summary, 120, 510, 660, 38);

  ctx.fillStyle = "#b44335";
  ctx.font = "700 26px Microsoft YaHei, sans-serif";
  wrapText(ctx, plan.quotes[1], 120, 700, 660, 40);

  ctx.fillStyle = "#18221f";
  ctx.font = "700 30px Microsoft YaHei, sans-serif";
  ctx.fillText(`连续学习 ${stats.streak} 天`, 120, 910);
  ctx.fillText(`累计 ${stats.totalMinutes} 分钟`, 120, 960);
  ctx.fillText(`素材 ${stats.archive.length} 张`, 120, 1010);

  ctx.fillStyle = "#1f6f5b";
  ctx.font = "600 22px Microsoft YaHei, sans-serif";
  ctx.fillText("今日完成：晨读 · 表达 · 小题 · 打卡", 120, 1080);

  const url = canvas.toDataURL("image/png");
  document.querySelector("#shareImage").src = url;
  document.querySelector("#downloadShare").href = url;
  document.querySelector("#sharePreview").hidden = false;
}

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  let line = "";
  for (const char of text) {
    const testLine = line + char;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      ctx.fillText(line, x, y);
      line = char;
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, y);
}