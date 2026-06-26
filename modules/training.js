import { getDailyPlan } from "./daily-card.js";
import { readStats, writeStats } from "./storage.js";

export function initTraining() {
  renderPractice();
  document.querySelector("#saveAnswer").addEventListener("click", saveAnswer);
  document.querySelector("#showReference").addEventListener("click", showReference);
  window.addEventListener("gongkao:modechange", renderPractice);
  window.addEventListener("gongkao:newschange", renderPractice);
}

function renderPractice() {
  const { news, question } = getDailyPlan();
  document.querySelector("#practiceMaterial").textContent = `${news.title}：${news.summary}`;
  document.querySelector('label[for="answerInput"]').textContent = `${question}（200 字以内）`;
  document.querySelector("#referenceAnswer").hidden = true;
}

function saveAnswer() {
  const input = document.querySelector("#answerInput");
  const value = input.value.trim();
  if (!value) {
    input.focus();
    return;
  }

  const stats = readStats();
  const { news, mode } = getDailyPlan();
  stats.answers = [
    ...stats.answers,
    {
      date: new Date().toISOString(),
      mode: mode.name,
      question: news.title,
      answer: value,
    },
  ];
  writeStats(stats);
  input.value = "";
}

function showReference() {
  const { news } = getDailyPlan();
  const answer = document.querySelector("#referenceAnswer");
  answer.hidden = false;
  answer.textContent = `参考思路：可从“问题导向、资源配置、制度协同、服务对象获得感”四个层面展开。${news.angle}不是单纯提升效率，更重要的是让公共服务更精准、更公平、更可持续。`;
}