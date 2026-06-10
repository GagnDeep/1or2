import { store } from '../store.js';
import { escapeHTML } from '../codec.js';
import { classicsDeck, getCategories, formatCategoryLabel } from '../decks.js';

let currentDeck = [];
let currentIndex = 0;
let containerEl = null;

export function renderDecks(container) {
  containerEl = container;
  startNewGame('all');
}

function startNewGame(category = 'all') {
  currentDeck = classicsDeck.filter(m => category === 'all' || m.category === category);
  // Shuffle
  currentDeck.sort(() => Math.random() - 0.5);
  currentIndex = 0;

  renderLayout(category);
  renderCurrentMatchup();
}

function renderLayout(activeCategory) {
  const categories = getCategories();

  const filtersHtml = categories.map(cat => {
    const label = formatCategoryLabel(cat);
    const activeClass = cat === activeCategory ? 'background-color: var(--ink); color: var(--bg-color);' : 'background-color: transparent;';
    return `<button class="badge" data-cat="${cat}" style="cursor: pointer; margin-right: 0.5rem; margin-bottom: 0.5rem; ${activeClass}">${label}</button>`;
  }).join('');

  containerEl.innerHTML = `
    <div class="container">
      <div class="flex justify-between items-center mb-1">
        <h1 class="display-text" style="font-size: 2rem; margin: 0;">The Classics</h1>
        <div class="flex gap-1 items-center">
          <div class="tactile-border" style="padding: 0.25rem 0.75rem; font-weight: 600;" title="Current Streak">
            🔥 <span id="decks-streak">${store.state.user.currentStreak}</span>
          </div>
          <div class="tactile-border" style="padding: 0.25rem 0.75rem; font-weight: 600;">
            <span id="decks-progress">0 / 0</span>
          </div>
        </div>
      </div>

      <div id="decks-filters" class="mb-2" role="tablist" aria-label="Category filters">
        ${filtersHtml}
      </div>

      <div id="decks-game-area" style="position: relative; min-height: 400px;">
        <!-- Matchup cards render here -->
      </div>
    </div>
  `;

  document.getElementById('decks-filters').addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON') {
      startNewGame(e.target.dataset.cat);
    }
  });

  // Bind pause handlers for auto-advance
  const gameArea = document.getElementById('decks-game-area');
  if (gameArea) {
    gameArea.addEventListener('mouseenter', () => toggleAutoAdvancePause(true));
    gameArea.addEventListener('mouseleave', () => toggleAutoAdvancePause(false));
    gameArea.addEventListener('focusin', () => toggleAutoAdvancePause(true));
    gameArea.addEventListener('focusout', () => toggleAutoAdvancePause(false));
  }
}

function renderCurrentMatchup() {
  const gameArea = document.getElementById('decks-game-area');
  const progressEl = document.getElementById('decks-progress');

  if (!gameArea || !progressEl) return;

  if (currentIndex >= currentDeck.length) {
    renderSummary();
    return;
  }

  const match = currentDeck[currentIndex];
  progressEl.textContent = `${currentIndex + 1} / ${currentDeck.length}`;

  const hasVoted = store.hasVoted('classic_' + match.id);

  gameArea.innerHTML = `
    <div class="flex flex-col gap-1" style="position: relative;">
      <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 10; background: var(--bg-color); padding: 0.5rem; border-radius: 50%; font-family: var(--font-display); font-weight: 700; border: 2px solid var(--ink);">OR</div>

      <button id="deck-opt-1" class="tactile-border hard-shadow" style="position: relative; overflow: hidden; padding: 2rem; background-color: var(--bg-color); cursor: pointer; text-align: left; display: flex; align-items: center; justify-content: space-between; outline: none;">
        <div style="display: flex; align-items: center; gap: 1rem; z-index: 2;">
          <span style="font-size: 2rem;" aria-hidden="true">${match.option1.emoji}</span>
          <span style="font-family: var(--font-display); font-size: 1.5rem; font-weight: 600;">${escapeHTML(match.option1.label)}</span>
        </div>
        <div id="deck-pct-1" style="font-family: var(--font-display); font-size: 1.5rem; font-weight: 700; z-index: 2; display: none;"></div>
        <div id="deck-bar-1" style="position: absolute; top: 0; left: 0; height: 100%; width: 0%; background-color: var(--red); opacity: 0.2; transition: width 0.6s cubic-bezier(0.22, 1, 0.36, 1); z-index: 1;"></div>
      </button>

      <button id="deck-opt-2" class="tactile-border hard-shadow" style="position: relative; overflow: hidden; padding: 2rem; background-color: var(--bg-color); cursor: pointer; text-align: left; display: flex; align-items: center; justify-content: space-between; outline: none;">
        <div style="display: flex; align-items: center; gap: 1rem; z-index: 2;">
          <span style="font-size: 2rem;" aria-hidden="true">${match.option2.emoji}</span>
          <span style="font-family: var(--font-display); font-size: 1.5rem; font-weight: 600;">${escapeHTML(match.option2.label)}</span>
        </div>
        <div id="deck-pct-2" style="font-family: var(--font-display); font-size: 1.5rem; font-weight: 700; z-index: 2; display: none;"></div>
        <div id="deck-bar-2" style="position: absolute; top: 0; left: 0; height: 100%; width: 0%; background-color: var(--blue); opacity: 0.2; transition: width 0.6s cubic-bezier(0.22, 1, 0.36, 1); z-index: 1;"></div>
      </button>
    </div>

    <div id="deck-feedback" class="mt-2 text-center" style="min-height: 60px;"></div>
  `;

  if (hasVoted) {
    const choice = store.getVote('classic_' + match.id);
    handleVote(choice, true);
  } else {
    document.getElementById('deck-opt-1').addEventListener('click', () => handleVote(0));
    document.getElementById('deck-opt-2').addEventListener('click', () => handleVote(1));
  }
}

function handleVote(choiceIndex, isReplay = false) {
  const match = currentDeck[currentIndex];
  const btn1 = document.getElementById('deck-opt-1');
  const btn2 = document.getElementById('deck-opt-2');

  if (!btn1 || !btn2 || btn1.disabled) return;

  btn1.disabled = true;
  btn2.disabled = true;

  btn1.style.cursor = 'default';
  btn2.style.cursor = 'default';

  if (choiceIndex === 0) {
    btn1.style.boxShadow = 'var(--hard-shadow-active)';
    btn1.style.transform = 'translate(4px, 4px)';
    btn1.style.border = '2px solid var(--red)';
  } else {
    btn2.style.boxShadow = 'var(--hard-shadow-active)';
    btn2.style.transform = 'translate(4px, 4px)';
    btn2.style.border = '2px solid var(--blue)';
  }

  let v1 = match.votes1;
  let v2 = match.votes2;

  if (!isReplay) {
    if (choiceIndex === 0) v1++; else v2++;
  }

  const total = v1 + v2;
  const pct1 = Math.round((v1 / total) * 100);
  const pct2 = 100 - pct1;

  document.getElementById('deck-pct-1').style.display = 'block';
  document.getElementById('deck-pct-2').style.display = 'block';
  document.getElementById('deck-pct-1').textContent = pct1 + '%';
  document.getElementById('deck-pct-2').textContent = pct2 + '%';

  // Animate bars
  setTimeout(() => {
    document.getElementById('deck-bar-1').style.width = pct1 + '%';
    document.getElementById('deck-bar-2').style.width = pct2 + '%';
  }, 50);

  const isMajority = (choiceIndex === 0 && pct1 >= pct2) || (choiceIndex === 1 && pct2 >= pct1);
  const isTie = pct1 === pct2;

  if (!isReplay) {
    store.recordVote('classic_' + match.id, choiceIndex, isMajority);
    const streakEl = document.getElementById('decks-streak');
    if (streakEl) streakEl.textContent = store.state.user.currentStreak;
  }

  const feedbackEl = document.getElementById('deck-feedback');

  let msg = '';
  if (isTie) msg = 'Perfect 50/50 split! ⚖️';
  else if (isMajority) msg = '<span class="badge majority">MAJORITY ✓</span> You are with the crowd.';
  else msg = '<span class="badge underdog">UNDERDOG</span> You went against the grain.';

  setTimeout(() => {
    feedbackEl.innerHTML = `
      <div class="mb-1" style="font-weight: 600;" aria-live="polite">${msg}</div>
      <button id="deck-next-btn" class="btn btn-primary hard-shadow" style="position: relative; overflow: hidden;">
        <span style="position: relative; z-index: 2;">Next →</span>
        <div id="deck-next-progress" style="position: absolute; bottom: 0; left: 0; height: 4px; background-color: var(--red); width: 0%; z-index: 1;"></div>
      </button>
    `;
    const nextBtn = document.getElementById('deck-next-btn');
    nextBtn.addEventListener('click', () => {
      clearAutoAdvance();
      currentIndex++;
      renderCurrentMatchup();
    });
    if (!isReplay) {
      nextBtn.focus();
      startAutoAdvance();
    }
  }, isReplay ? 0 : 800);
}

// Auto-advance logic matching v1
let autoAdvanceTimer = null;
let autoAdvanceStart = 0;
let autoAdvancePausedTime = 0;
let autoAdvanceIsPaused = false;
const AUTO_ADVANCE_MS = 3000;

function clearAutoAdvance() {
  if (autoAdvanceTimer) {
    cancelAnimationFrame(autoAdvanceTimer);
    autoAdvanceTimer = null;
  }
}

function startAutoAdvance() {
  clearAutoAdvance();
  autoAdvanceStart = performance.now();
  autoAdvancePausedTime = 0;
  autoAdvanceIsPaused = false;

  const tick = (now) => {
    if (autoAdvanceIsPaused) {
      autoAdvanceStart += (now - autoAdvancePausedTime);
      autoAdvancePausedTime = now;
    }

    const elapsed = now - autoAdvanceStart;
    const progress = Math.min(elapsed / AUTO_ADVANCE_MS, 1);

    const progressBar = document.getElementById('deck-next-progress');
    if (progressBar && !autoAdvanceIsPaused) {
      progressBar.style.width = `${progress * 100}%`;
    }

    if (progress >= 1) {
      clearAutoAdvance();
      currentIndex++;
      renderCurrentMatchup();
    } else {
      autoAdvanceTimer = requestAnimationFrame(tick);
    }
  };

  autoAdvanceTimer = requestAnimationFrame(tick);
}

function toggleAutoAdvancePause(pause) {
  if (pause && !autoAdvanceIsPaused) {
    autoAdvanceIsPaused = true;
    autoAdvancePausedTime = performance.now();
  } else if (!pause && autoAdvanceIsPaused) {
    autoAdvanceIsPaused = false;
  }
}

function renderSummary() {
  const gameArea = document.getElementById('decks-game-area');
  gameArea.innerHTML = `
    <div class="tactile-border hard-shadow text-center" style="padding: 3rem 1rem;">
      <h2 class="display-text mb-1" style="font-size: 2.5rem;">Deck Complete</h2>
      <p class="mb-2">You've voted on all matches in this category.</p>
      <button id="deck-replay-btn" class="btn btn-primary hard-shadow">Play Another Category</button>
    </div>
  `;
  document.getElementById('deck-replay-btn').addEventListener('click', () => {
    startNewGame('all');
  });
}
