import { readStats, replaceStats, todayKey } from "./storage.js";

export function initBackup() {
  document.querySelector("#exportData").addEventListener("click", exportData);
  document.querySelector("#importData").addEventListener("change", importData);
}

function exportData() {
  const payload = {
    app: "gongkao-morning-study",
    version: 1,
    exportedAt: new Date().toISOString(),
    stats: readStats(),
    mode: localStorage.getItem("gongkao:mode") || "civil",
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `gongkao-study-backup-${todayKey()}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

function importData(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const payload = JSON.parse(String(reader.result));
      if (!payload.stats) throw new Error("Invalid backup");
      replaceStats(payload.stats);
      if (payload.mode) localStorage.setItem("gongkao:mode", payload.mode);
      window.dispatchEvent(new CustomEvent("gongkao:modechange"));
      window.dispatchEvent(new CustomEvent("gongkao:archivechange"));
    } catch {
      alert("导入失败，请确认文件是公考早自习导出的 JSON 备份。");
    }
  };
  reader.readAsText(file);
  event.target.value = "";
}