const DEFAULT_STATS = {
  lastCheckin: "",
  streak: 0,
  totalMinutes: 0,
  favorites: [],
  answers: [],
  archive: [],
  progress: {},
};

export function todayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function readStats() {
  try {
    return normalizeStats(JSON.parse(localStorage.getItem("gongkao:stats")));
  } catch {
    return { ...DEFAULT_STATS };
  }
}

export function writeStats(stats) {
  const nextStats = normalizeStats(stats);
  localStorage.setItem("gongkao:stats", JSON.stringify(nextStats));
  syncStatsView(nextStats);
}

export function replaceStats(stats) {
  writeStats(normalizeStats(stats));
  window.dispatchEvent(new CustomEvent("gongkao:statschange"));
}

export function syncStatsView(stats) {
  const safeStats = normalizeStats(stats);
  const hours = (safeStats.totalMinutes / 60).toFixed(safeStats.totalMinutes >= 60 ? 1 : 0);
  setText("#streakCount", safeStats.streak);
  setText("#totalMinutes", safeStats.totalMinutes);
  setText("#favoriteCount", safeStats.favorites.length + safeStats.archive.length);
  setText("#growthStreak", `${safeStats.streak} 天`);
  setText("#growthTime", `${hours} 小时`);
  setText("#growthAnswers", `${safeStats.answers.length} 篇`);
}

function normalizeStats(stats) {
  return {
    ...DEFAULT_STATS,
    ...(stats || {}),
    favorites: Array.isArray(stats?.favorites) ? stats.favorites : [],
    answers: Array.isArray(stats?.answers) ? stats.answers : [],
    archive: Array.isArray(stats?.archive) ? stats.archive : [],
    progress: stats?.progress && typeof stats.progress === "object" ? stats.progress : {},
    totalMinutes: Number(stats?.totalMinutes || 0),
    streak: Number(stats?.streak || 0),
  };
}

function setText(selector, value) {
  const node = document.querySelector(selector);
  if (node) node.textContent = value;
}