import { initBackup } from "./modules/backup.js";
import { initCheckin } from "./modules/checkin.js";
import { initDailyCard } from "./modules/daily-card.js";
import { initNews } from "./modules/news.js";
import { initQuotes } from "./modules/quotes.js";
import { initTimer } from "./modules/timer.js";
import { initTraining } from "./modules/training.js";
import { renderTopics } from "./modules/topics.js";
import { readStats, syncStatsView, writeStats } from "./modules/storage.js";

const todayLabel = document.querySelector("#todayLabel");
const today = new Date();
todayLabel.textContent = today.toLocaleDateString("zh-CN", {
  year: "numeric",
  month: "long",
  day: "numeric",
  weekday: "long",
});

initTimer({
  onComplete(minutes) {
    const stats = readStats();
    stats.totalMinutes += minutes;
    writeStats(stats);
  },
});

initCheckin();
initDailyCard();
initNews();
initQuotes();
initTraining();
renderTopics();
initBackup();
syncStatsView(readStats());