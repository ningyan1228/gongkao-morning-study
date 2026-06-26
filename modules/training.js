import { mockNews } from "../data/mock-news.js";
import { readStats, writeStats } from "./storage.js";

const dailyItem = mockNews[new Date().getDate() % mockNews.length];

export function initTraining() {
  document.querySelector("#practiceMaterial").textContent =
    `${dailyItem.title}：${dailyItem.summary}`;
  document.querySelector("#saveAnswer").addEventListener("click", saveAnswer);
  document.querySelector("#showReference").addEventListener("click", showReference);
}

function saveAnswer() {
  const input = document.querySelector("#answerInput");
  const value = input.value.trim();
  if (!value) {
    input.focus();
    return;
  }

  const stats = readStats();
  stats.answers = [
    ...stats.answers,
    {
      date: new Date().toISOString(),
      question: dailyItem.title,
      answer: value,
    },
  ];
  writeStats(stats);
  input.value = "";
}

function showReference() {
  const answer = document.querySelector("#referenceAnswer");
  answer.hidden = false;
  answer.textContent = `参考思路：可从“问题导向、技术赋能、制度协同、群众获得感”四个层面展开。${dailyItem.angle}不是单纯提升效率，更重要的是让公共服务更精准、更公平、更可持续。`;
}
