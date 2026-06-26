const DEFAULT_STATS = {
  lastCheckin: "",
  streak: 0,
  totalMinutes: 0,
  favorites: [],
  answers: [],
};

export function todayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function readStats() {
  try {
    return { ...DEFAULT_STATS, ...JSON.parse(localStorage.getItem("gongkao:stats")) };
  } catch {
    return { ...DEFAULT_STATS };
  }
}

export function writeStats(stats) {
  localStorage.setItem("gongkao:stats", JSON.stringify(stats));
  syncStatsView(stats);
}

export function syncStatsView(stats) {
  const hours = (stats.totalMinutes / 60).toFixed(stats.totalMinutes >= 60 ? 1 : 0);
  setText("#streakCount", stats.streak);
  setText("#totalMinutes", stats.totalMinutes);
  setText("#favoriteCount", stats.favorites.length);
  setText("#growthStreak", `${stats.streak} 天`);
  setText("#growthTime", `${hours} 小时`);
  setText("#growthAnswers", `${stats.answers.length} 篇`);
}

function setText(selector, value) {
  const node = document.querySelector(selector);
  if (node) node.textContent = value;
}
