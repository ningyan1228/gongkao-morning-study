import { quotes } from "../data/quotes.js";

let quoteIndex = new Date().getDate() % quotes.length;

export function initQuotes() {
  document.querySelector("#nextQuote").addEventListener("click", () => {
    quoteIndex = (quoteIndex + 1) % quotes.length;
    renderQuote();
  });
  renderQuote();
}

function renderQuote() {
  document.querySelector("#quoteBox").textContent = quotes[quoteIndex];
}
