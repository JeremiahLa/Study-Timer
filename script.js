document.addEventListener("DOMContentLoaded", () => {
  const modeButtons = document.querySelectorAll(".mode-btn");
  const soundButtons = document.querySelectorAll(".sound-btn");
  const timerDisplay = document.getElementById("timer-display");
  const startBtn = document.getElementById("start-btn");
  const pauseBtn = document.getElementById("pause-btn");
  const resetBtn = document.getElementById("reset-btn");
  const clickCounterBtn = document.getElementById("click-counter-btn");
  const clickCounterDisplay = document.getElementById("click-counter");
  const ringProgress = document.getElementById("ring-progress");
  const secretPieces = document.querySelectorAll(".secret-piece");
  const secretMessage = document.getElementById("secret-message");
  const secretReveal = document.getElementById("secret-reveal");
  let endingTriggered = false;

  const durations = {
    work: 3 * 60,
    break: 1 * 60,
  };

  let currentMode = "work";
  let timeLeft = durations[currentMode];
  let timerId = null;
  let activeAmbientSound = null;

  const ambientSounds = {
    rain: new Audio("https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3"),
    fireplace: new Audio("https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3"),
  };

  function formatTime(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  function renderTimer() {
    timerDisplay.textContent = formatTime(timeLeft);

    const totalDuration = durations[currentMode];
    const progressRatio = timeLeft / totalDuration;
    const circumference = 2 * Math.PI * 54;
    const offset = circumference * (1 - progressRatio);
    ringProgress.style.strokeDashoffset = offset;
  }

  function stopTimer() {
    if (timerId) {
      clearInterval(timerId);
      timerId = null;
    }

    startBtn.disabled = false;
    pauseBtn.disabled = true;
    startBtn.classList.remove("primary");
    pauseBtn.classList.add("primary");
  }

  function closeTimer() {
    stopTimer();
    timeLeft = 0;
    renderTimer();
    startBtn.disabled = true;
    pauseBtn.disabled = true;
    resetBtn.disabled = true;
    startBtn.classList.remove("primary");
    pauseBtn.classList.add("primary");
  }

  function showEndingNotification() {
    secretMessage.textContent = "Leave";
    secretMessage.classList.add("visible");

    setTimeout(() => {
      secretMessage.classList.remove("visible");
    }, 1800);
  }

  function playCompletionAlert() {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.type = "sine";
      oscillator.frequency.value = 880;
      gainNode.gain.value = 0.08;

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.start();
      gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.4);
      oscillator.stop(audioContext.currentTime + 0.4);
    } catch (error) {
      console.warn("Audio notification unavailable:", error);
    }

    alert("Time's up! Your timer has finished.");
  }

  function startTimer() {
    if (timerId) return;

    startBtn.disabled = true;
    pauseBtn.disabled = false;
    resetBtn.disabled = false;
    startBtn.classList.add("primary");
    pauseBtn.classList.remove("primary");

    timerId = setInterval(() => {
      timeLeft -= 1;

      if (timeLeft <= 0) {
        timeLeft = 0;
        renderTimer();
        stopTimer();
        playCompletionAlert();
      } else {
        renderTimer();
      }
    }, 1000);
  }

  function resetTimer() {
    stopTimer();
    timeLeft = durations[currentMode];
    renderTimer();
  }

  function applyUnsettlingEffect() {
    const layerLevel = Math.min(secretPhase, 3);
    document.body.classList.remove("layer-0", "layer-1", "layer-2", "layer-3");
    document.body.classList.add(`layer-${layerLevel}`);

    const ringColors = ["#f59e0b", "#f97316", "#ef4444", "#7f1d1d"];
    ringProgress.style.stroke = ringColors[layerLevel];
    ringProgress.style.filter = layerLevel > 0
      ? `drop-shadow(0 0 ${6 + layerLevel * 3}px rgba(239, 68, 68, 0.35))`
      : "";
  }

  modeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      modeButtons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");
      currentMode = button.textContent.includes("Break") ? "break" : "work";
      resetTimer();
    });
  });

  function setAmbientSound(button, soundKey) {
    const selectedSound = ambientSounds[soundKey];

    if (!selectedSound) return;

    if (activeAmbientSound === selectedSound) {
      selectedSound.pause();
      selectedSound.currentTime = 0;
      button.classList.remove("active");
      button.setAttribute("aria-pressed", "false");
      activeAmbientSound = null;
      return;
    }

    if (activeAmbientSound) {
      activeAmbientSound.pause();
      activeAmbientSound.currentTime = 0;
      soundButtons.forEach((btn) => {
        btn.classList.remove("active");
        btn.setAttribute("aria-pressed", "false");
      });
    }

    selectedSound.loop = true;
    selectedSound.play().catch((error) => {
      console.warn("Ambient sound playback failed:", error);
    });
    button.classList.add("active");
    button.setAttribute("aria-pressed", "true");
    activeAmbientSound = selectedSound;
  }

  soundButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setAmbientSound(button, button.dataset.sound);
    });
  });

  startBtn.addEventListener("click", startTimer);
  pauseBtn.addEventListener("click", stopTimer);
  resetBtn.addEventListener("click", resetTimer);

  pauseBtn.disabled = true;
  resetBtn.disabled = false;

  let clicks = 0;
  clickCounterBtn.addEventListener("click", () => {
    clicks += 1;
    clickCounterDisplay.textContent = clicks;
  });

  const secretSequences = [
    ["1", "2", "3", "4"],
    ["4", "3", "2", "1"],
    ["2", "5", "6", "3"],
    ["6", "5", "2", "1"]
  ];
  let secretProgress = 0;
  let secretPhase = 0;

  secretPieces.forEach((piece) => {
    piece.addEventListener("click", () => {
      if (secretPhase >= secretSequences.length) {
        secretMessage.textContent = "The hidden path is already open.";
        secretMessage.classList.add("visible");
        setTimeout(() => {
          secretMessage.classList.remove("visible");
        }, 1800);
        return;
      }

      const expected = secretSequences[secretPhase][secretProgress];

      if (piece.dataset.piece === expected) {
        piece.classList.add("active");
        secretProgress += 1;

        if (secretProgress === secretSequences[secretPhase].length) {
          secretProgress = 0;
          secretPhase += 1;

          if (secretPhase < secretSequences.length) {
            secretPieces.forEach((p) => p.classList.remove("active"));
            secretMessage.textContent = `Layer ${secretPhase + 1} unlocked.`;
          } else {
            secretReveal.classList.add("visible");
            secretMessage.textContent = "You uncovered the deepest secret.";
          }

          applyUnsettlingEffect();
          secretMessage.classList.add("visible");
        }
      } else {
        secretProgress = 0;
        secretPieces.forEach((p) => p.classList.remove("active"));
        secretMessage.textContent = `Layer ${secretPhase + 1} is still active.`;
        secretMessage.classList.add("visible");
      }

      setTimeout(() => {
        secretMessage.classList.remove("visible");
      }, 1800);
    });
  });

  secretReveal.classList.add("visible");
  applyUnsettlingEffect();

  secretReveal.addEventListener("click", () => {
    if (secretPhase < secretSequences.length) {
      secretMessage.textContent = "The star is still waiting for the deeper pattern.";
      secretMessage.classList.add("visible");
      setTimeout(() => {
        secretMessage.classList.remove("visible");
      }, 1800);
      return;
    }

    if (endingTriggered) return;

    endingTriggered = true;
    secretReveal.classList.add("active");
    showEndingNotification();

    setTimeout(() => {
      closeTimer();
    }, 10500);
  });

  renderTimer();
});
