import { topics } from "../data/topics.js";

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
}
