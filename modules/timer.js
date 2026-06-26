let durationMinutes = 45;
let secondsLeft = durationMinutes * 60;
let timerId = null;
let onCompleteCallback = null;

export function initTimer({ onComplete } = {}) {
  onCompleteCallback = onComplete;

  document.querySelectorAll("[data-duration]").forEach((button) => {
    button.addEventListener("click", () => {
      durationMinutes = Number(button.dataset.duration);
      secondsLeft = durationMinutes * 60;
      setActiveDuration(button);
      updateDisplay();
    });
  });

  document.querySelector("#startTimer").addEventListener("click", startTimer);
  document.querySelector("#pauseTimer").addEventListener("click", pauseTimer);
  document.querySelector("#resetTimer").addEventListener("click", resetTimer);
  updateDisplay();
}

function startTimer() {
  if (timerId) return;
  timerId = window.setInterval(() => {
    secondsLeft -= 1;
    updateDisplay();
    if (secondsLeft <= 0) {
      pauseTimer();
      onCompleteCallback?.(durationMinutes);
      secondsLeft = durationMinutes * 60;
      updateDisplay();
    }
  }, 1000);
}

function pauseTimer() {
  window.clearInterval(timerId);
  timerId = null;
}

function resetTimer() {
  pauseTimer();
  secondsLeft = durationMinutes * 60;
  updateDisplay();
}

function setActiveDuration(activeButton) {
  document
    .querySelectorAll("[data-duration]")
    .forEach((button) => button.classList.toggle("is-active", button === activeButton));
}

function updateDisplay() {
  const minutes = Math.floor(secondsLeft / 60).toString().padStart(2, "0");
  const seconds = (secondsLeft % 60).toString().padStart(2, "0");
  document.querySelector("#timerDisplay").textContent = `${minutes}:${seconds}`;
  document.querySelector("#timerMode").textContent = `${durationMinutes} min`;
}
