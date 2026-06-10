// Import data natively as module (requires build tool or modern browser setup, but since it's no-build we'll fetch it)

let matchupsData = [];
let currentDeck = [];
let currentIndex = 0;
let userStats = {
  totalVotes: 0,
  majorityMatches: 0,
  currentStreak: 0,
  bestStreak: 0,
  votes: {} // id -> choice
};
let runStats = {
  answered: 0,
  matches: 0
};
let isAnimating = false;
let autoAdvanceTimer = null;
let autoAdvanceStart = 0;
let autoAdvancePausedTime = 0;
let autoAdvanceIsPaused = false;
const AUTO_ADVANCE_MS = 2500;

// DOM Elements
const gameContainer = document.getElementById('game-container');
const summaryContainer = document.getElementById('summary-container');
const card1 = document.getElementById('card-1');
const card2 = document.getElementById('card-2');
const cardsWrapper = document.getElementById('cards-wrapper');
const progressText = document.getElementById('progress-text');
const agreementText = document.getElementById('agreement-text');
const streakText = document.getElementById('streak-text');
const interactionArea = document.getElementById('interaction-area');
const filtersContainer = document.getElementById('filters');

// Load App
async function init() {
  try {
    const res = await fetch('./data/matchups.json');
    if (!res.ok) throw new Error('Failed to load data');
    matchupsData = await res.json();

    loadStats();
    buildFilters();
    startNewGame();
    setupEventListeners();
  } catch (err) {
    console.error(err);
    gameContainer.innerHTML = `<p style="text-align:center; color: var(--color-1);">Error loading matchups. Make sure you are running a local server.</p>`;
  }
}

// Stats Management
function loadStats() {
  const saved = localStorage.getItem('1or2_stats');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      userStats = { ...userStats, ...parsed };
      if (!userStats.votes) userStats.votes = {};
      if (!userStats.currentStreak) userStats.currentStreak = 0;
      if (!userStats.bestStreak) userStats.bestStreak = 0;
    } catch (e) {
      console.warn("Could not parse stats", e);
    }
  }
  updateHeaderStats();
}

function saveStats() {
  localStorage.setItem('1or2_stats', JSON.stringify(userStats));
}

function updateHeaderStats() {
  const agreement = userStats.totalVotes === 0 ? 0 : Math.round((userStats.majorityMatches / userStats.totalVotes) * 100);
  agreementText.textContent = `${agreement}%`;
  streakText.textContent = userStats.currentStreak;
}

// Game Logic
function shuffleArray(array) {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
}

function startNewGame(category = 'all') {
  if (category === 'all') {
    currentDeck = shuffleArray(matchupsData);
  } else {
    currentDeck = shuffleArray(matchupsData.filter(m => m.category === category));
  }

  runStats = { answered: 0, matches: 0 };
  currentIndex = 0;
  gameContainer.classList.remove('hidden');
  summaryContainer.classList.add('hidden');
  renderCurrentMatchup();
}

function clearAutoAdvance() {
  if (autoAdvanceTimer) {
    cancelAnimationFrame(autoAdvanceTimer);
    autoAdvanceTimer = null;
  }
}

function renderCurrentMatchup() {
  clearAutoAdvance();
  if (currentIndex >= currentDeck.length) {
    showSummary();
    return;
  }

  isAnimating = false;
  const match = currentDeck[currentIndex];

  progressText.textContent = `${currentIndex + 1} / ${currentDeck.length}`;

  // Reset Cards
  cardsWrapper.className = 'matchup-cards';
  interactionArea.innerHTML = '';

  // Update Card 1
  card1.className = 'card option-1';
  card1.setAttribute('aria-label', `Vote for ${match.option1.label}`);
  card1.innerHTML = `
    <div class="emoji" aria-hidden="true">${match.option1.emoji}</div>
    <div class="label">${match.option1.label}</div>
    <div class="percent-label" id="pct-1"></div>
    <div class="result-bar-bg" id="bar-1"></div>
  `;

  // Update Card 2
  card2.className = 'card option-2';
  card2.setAttribute('aria-label', `Vote for ${match.option2.label}`);
  card2.innerHTML = `
    <div class="emoji" aria-hidden="true">${match.option2.emoji}</div>
    <div class="label">${match.option2.label}</div>
    <div class="percent-label" id="pct-2"></div>
    <div class="result-bar-bg" id="bar-2"></div>
  `;

  if (userStats.votes[match.id]) {
    // Already voted, show results immediately
    handleVote(userStats.votes[match.id], true);
  }
}

function handleVote(choice, isReplay = false) {
  if (!isReplay && (isAnimating || cardsWrapper.classList.contains('voted'))) return;
  isAnimating = true;

  const match = currentDeck[currentIndex];

  // Optimistically add user vote if not a replay
  if (!isReplay) {
    if (choice === 1) match.votes1++;
    else match.votes2++;
  }

  const total = match.votes1 + match.votes2;
  const pct1 = Math.round((match.votes1 / total) * 100);
  const pct2 = 100 - pct1; // Ensure it sums to 100

  // Apply visual state
  cardsWrapper.classList.add('voted');

  const c1 = document.getElementById('card-1');
  const c2 = document.getElementById('card-2');

  if (choice === 1) c1.classList.add('selected');
  else c2.classList.add('selected');

  // Animate bars and numbers
  const bar1 = document.getElementById('bar-1');
  const bar2 = document.getElementById('bar-2');
  const l1 = document.getElementById('pct-1');
  const l2 = document.getElementById('pct-2');

  // Force reflow before applying width
  void bar1.offsetWidth;

  bar1.style.width = `${pct1}%`;
  bar2.style.width = `${pct2}%`;

  l1.textContent = `${pct1}%`;
  l2.textContent = `${pct2}%`;

  // Calculate Majority
  const isMajority = (choice === 1 && pct1 >= pct2) || (choice === 2 && pct2 >= pct1);
  const isTie = pct1 === pct2;

  // Update Stats
  if (!isReplay) {
    userStats.votes[match.id] = choice;
    userStats.totalVotes++;
    runStats.answered++;

    if (isMajority) {
      userStats.majorityMatches++;
      userStats.currentStreak++;
      runStats.matches++;
      if (userStats.currentStreak > userStats.bestStreak) {
        userStats.bestStreak = userStats.currentStreak;
      }
    } else {
      userStats.currentStreak = 0;
    }
    saveStats();
    updateHeaderStats();
  }

  // Show Feedback
  let feedbackHtml = '';
  if (isTie) {
    feedbackHtml = `<div class="feedback-text" aria-live="polite">Perfect 50/50 split! ⚖️</div>`;
  } else if (isMajority) {
    feedbackHtml = `<div class="feedback-text majority-match" aria-live="polite">You're with the majority 🔥</div>`;
  } else {
    feedbackHtml = `<div class="feedback-text minority-match" aria-live="polite">You went against the crowd 🐺</div>`;
  }

  feedbackHtml += `<button id="next-btn" class="btn">Next <span aria-hidden="true">→</span><div class="progress-bar-container" id="next-progress"></div></button>`;

  setTimeout(() => {
    interactionArea.innerHTML = feedbackHtml;
    const nextBtn = document.getElementById('next-btn');
    nextBtn.addEventListener('click', nextMatchup);
    if (!isReplay) {
      nextBtn.focus();
    }

    startAutoAdvance();

    // Confetti effect if majority
    if (!isReplay && isMajority && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      createConfetti(choice);
    }
  }, isReplay ? 0 : 1000);
}

function startAutoAdvance() {
  clearAutoAdvance();
  autoAdvanceStart = performance.now();
  autoAdvancePausedTime = 0;
  autoAdvanceIsPaused = false;

  const progressBar = document.getElementById('next-progress');

  const tick = (now) => {
    if (autoAdvanceIsPaused) {
      autoAdvanceStart += (now - autoAdvancePausedTime);
      autoAdvancePausedTime = now;
    }

    const elapsed = now - autoAdvanceStart;
    const progress = Math.min(elapsed / AUTO_ADVANCE_MS, 1);

    if (progressBar && !autoAdvanceIsPaused) {
      progressBar.style.width = `${progress * 100}%`;
    }

    if (progress >= 1) {
      nextMatchup();
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

function nextMatchup() {
  clearAutoAdvance();
  currentIndex++;
  renderCurrentMatchup();
}

// Filters
function formatCategoryLabel(cat) {
  if (cat === 'all') return 'All';
  if (cat.includes('/')) {
    return cat.split('/').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' & ');
  }
  return cat.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

function buildFilters() {
  const categories = ['all', ...new Set(matchupsData.map(m => m.category))];

  filtersContainer.innerHTML = categories.map(cat => {
    const label = formatCategoryLabel(cat);
    return `<button class="chip ${cat === 'all' ? 'active' : ''}" data-cat="${cat}">${label}</button>`;
  }).join('');

  filtersContainer.addEventListener('click', (e) => {
    if (e.target.classList.contains('chip')) {
      document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      e.target.classList.add('active');
      startNewGame(e.target.dataset.cat);
    }
  });
}

// Summary Screen
function showSummary() {
  clearAutoAdvance();
  gameContainer.classList.add('hidden');
  summaryContainer.classList.remove('hidden');

  const agreement = userStats.totalVotes === 0 ? 0 : Math.round((userStats.majorityMatches / userStats.totalVotes) * 100);

  document.getElementById('run-votes').textContent = runStats.answered;
  document.getElementById('run-matches').textContent = runStats.matches;

  document.getElementById('final-votes').textContent = userStats.totalVotes;
  document.getElementById('final-agreement').textContent = `${agreement}%`;
  document.getElementById('final-streak').textContent = userStats.currentStreak;
  document.getElementById('final-best-streak').textContent = userStats.bestStreak;

  document.getElementById('play-again-btn').onclick = () => startNewGame();

  document.getElementById('share-btn').onclick = () => {
    const text = `I sided with the crowd ${userStats.majorityMatches}/${userStats.totalVotes} times on 1or2.com 🎯\nPlay now: https://1or2.com`;
    navigator.clipboard.writeText(text).then(() => {
      const btn = document.getElementById('share-btn');
      const original = btn.innerHTML;
      btn.innerHTML = 'Copied! ✨';
      setTimeout(() => btn.innerHTML = original, 2000);
    });
  };
}

// Event Listeners
function setupEventListeners() {
  card1.addEventListener('click', () => handleVote(1));
  card2.addEventListener('click', () => handleVote(2));

  // Pause auto-advance on hover/focus
  const pauseAdvance = () => toggleAutoAdvancePause(true);
  const resumeAdvance = () => toggleAutoAdvancePause(false);

  gameContainer.addEventListener('mouseenter', pauseAdvance, true);
  gameContainer.addEventListener('mouseleave', resumeAdvance, true);
  gameContainer.addEventListener('focusin', pauseAdvance, true);
  gameContainer.addEventListener('focusout', resumeAdvance, true);

  // Keyboard support
  document.addEventListener('keydown', (e) => {
    if (summaryContainer.classList.contains('hidden')) {
      if (e.key === '1') handleVote(1);
      if (e.key === '2') handleVote(2);
      if ((e.key === 'Enter' || e.key === 'ArrowRight') && cardsWrapper.classList.contains('voted')) {
         const nextBtn = document.getElementById('next-btn');
         if(nextBtn) nextBtn.click();
      }
    }
  });
}

// Minimal Confetti
function createConfetti(choice) {
  const color = choice === 1 ? 'var(--color-1)' : 'var(--color-2)';
  for (let i = 0; i < 30; i++) {
    const confetti = document.createElement('div');
    confetti.style.position = 'fixed';
    confetti.style.width = '10px';
    confetti.style.height = '10px';
    confetti.style.backgroundColor = color;
    confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';

    // Start position based on choice
    const startX = choice === 1 ? window.innerWidth * 0.25 : window.innerWidth * 0.75;
    confetti.style.left = startX + 'px';
    confetti.style.top = '50%';
    confetti.style.zIndex = '100';
    confetti.style.pointerEvents = 'none';

    // Random destination
    const tx = (Math.random() - 0.5) * 300;
    const ty = (Math.random() - 1) * 300;
    const rot = Math.random() * 360;

    confetti.animate([
      { transform: 'translate(0,0) scale(1) rotate(0)', opacity: 1 },
      { transform: `translate(${tx}px, ${ty}px) scale(0) rotate(${rot}deg)`, opacity: 0 }
    ], {
      duration: 1000 + Math.random() * 1000,
      easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      fill: 'forwards'
    });

    document.body.appendChild(confetti);
    setTimeout(() => confetti.remove(), 2000);
  }
}

// Boot
document.addEventListener('DOMContentLoaded', init);
