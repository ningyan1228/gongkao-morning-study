import { topics } from "../data/topics.js";
import { readStats } from "./storage.js";

export function renderTopics() {
  document.querySelector("#topicGrid").innerHTML = topics
    .map(
      (topic) => `
        <article class="topic-card">
          <span>${topic.name}</span>
          <h3>${topic.title}</h3>
          <p>${topic.detail}</p>
        </article>
      `,
    )
    .join("");
  renderArchive();
  window.addEventListener("gongkao:archivechange", renderArchive);
  window.addEventListener("gongkao:statschange", renderArchive);
}

function renderArchive() {
  const archive = readStats().archive;
  const list = document.querySelector("#archiveList");
  if (!archive.length) {
    list.innerHTML = '<p class="panel-note">点击“今日早读卡”的入库后，会在这里沉淀成可复习素材卡。</p>';
    return;
  }

  list.innerHTML = `
    <h3>已入库素材</h3>
    ${archive
      .slice(0, 8)
      .map(
        (item) => `
          <article class="archive-card">
            <span class="news-tag">${item.mode} · ${item.topic}</span>
            <h3>${item.title}</h3>
            <p><strong>问题：</strong>${item.problem}</p>
            <p><strong>措施：</strong>${item.measure}</p>
            <p><strong>意义：</strong>${item.meaning}</p>
            <p><strong>表达：</strong>${item.expression}</p>
          </article>
        `,
      )
      .join("")}
  `;
}