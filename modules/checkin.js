import { readStats, todayKey, writeStats } from "./storage.js";

export function initCheckin() {
  const button = document.querySelector("#checkinButton");
  button.addEventListener("click", completeCheckin);
  renderCheckin(readStats());
}

function completeCheckin() {
  const stats = readStats();
  const today = todayKey();

  if (stats.lastCheckin === today) {
    renderCheckin(stats);
    return;
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  stats.streak = stats.lastCheckin === todayKey(yesterday) ? stats.streak + 1 : 1;
  stats.lastCheckin = today;
  writeStats(stats);
  renderCheckin(stats);
}

function renderCheckin(stats) {
  const isDone = stats.lastCheckin === todayKey();
  const status = document.querySelector("#checkinStatus");
  const note = document.querySelector("#checkinNote");
  const button = document.querySelector("#checkinButton");

  status.textContent = isDone ? "已完成" : "未完成";
  status.classList.toggle("is-done", isDone);
  button.textContent = isDone ? "今天已打卡" : "完成早自习";
  note.textContent = isDone
    ? `今天已经完成早自习，当前连续学习 ${stats.streak} 天。`
    : "完成一次 30 分钟以上晨读后打卡，系统会记录连续天数。";
}
