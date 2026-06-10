import { store } from '../store.js';
import { decodePoll, hashPayload, escapeHTML } from '../codec.js';

let containerEl = null;
let currentPoll = null;
let pollId = null;

// Tournament State
let bracketMatches = [];
let currentBracketIndex = 0;
let roundNumber = 1;

export async function renderPlay(container, payload) {
  containerEl = container;
  containerEl.innerHTML = `<div class="container text-center mt-2"><h2 class="display-text">Loading Poll...</h2></div>`;

  try {
    currentPoll = await decodePoll(payload);
    pollId = await hashPayload(payload);

    if (currentPoll.type === 'tournament') {
      initTournament();
    } else {
      renderStandardPoll();
    }
  } catch (e) {
    console.error("Play component error:", e);
    containerEl.innerHTML = `
      <div class="container text-center tactile-border hard-shadow mt-2" style="padding: 4rem 2rem; max-width: 600px;">
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin: 0 auto 1.5rem;">
          <path d="M40 8C22.3269 8 8 22.3269 8 40C8 57.6731 22.3269 72 40 72C57.6731 72 72 57.6731 72 40C72 22.3269 57.6731 8 40 8Z" stroke="var(--ink)" stroke-width="4"/>
          <path d="M28 28L52 52" stroke="var(--ink)" stroke-width="4" stroke-linecap="round"/>
          <path d="M52 28L28 52" stroke="var(--ink)" stroke-width="4" stroke-linecap="round"/>
        </svg>
        <h2 class="display-text mb-1">Invalid Link</h2>
        <p style="opacity: 0.8; margin-bottom: 2rem;">We couldn't decode this poll. The link might be incomplete or corrupted.</p>
        <a href="#/" class="btn btn-primary hard-shadow">Go Home</a>
      </div>
    `;
  }
}

function renderStandardPoll() {
  const hasVoted = store.hasVoted(pollId);
  const title = escapeHTML(currentPoll.title);
  const desc = currentPoll.description ? `<p style="opacity: 0.8; margin-bottom: 2rem;">${escapeHTML(currentPoll.description)}</p>` : '';
  const canSeeResults = currentPoll.seeResultsBefore && !hasVoted;

  let optionsHtml = '';

  const renderOptVisual = (opt, sizeClass) => {
    if (opt.image) {
      return `<img src="${escapeHTML(opt.image)}" alt="Option image" style="width: 4rem; height: 4rem; object-fit: cover; border-radius: 4px; border: 1px solid var(--ink);" onerror="this.onerror=null; this.outerHTML='<span style=\\'font-size: ${sizeClass};\\' aria-hidden=\\'true\\'>${opt.emoji}</span>'">`;
    }
    return `<span style="font-size: ${sizeClass};" aria-hidden="true">${opt.emoji}</span>`;
  };

  if (currentPoll.type === 'duel' || currentPoll.type === 'verdict') {
    optionsHtml = `
      <div class="flex flex-col gap-1 stagger-enter" style="position: relative;">
        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 10; background: var(--bg-color); padding: 0.5rem; border-radius: 50%; font-family: var(--font-display); font-weight: 700; border: 2px solid var(--ink);">OR</div>
        ${currentPoll.options.map((opt, i) => `
          <button class="tactile-border hard-shadow poll-opt-btn" data-idx="${i}" style="position: relative; overflow: hidden; padding: 2rem; background-color: var(--bg-color); cursor: pointer; text-align: left; display: flex; align-items: center; justify-content: space-between; outline: none;">
            <div style="display: flex; align-items: center; gap: 1rem; z-index: 2;">
              ${renderOptVisual(opt, '2rem')}
              <span style="font-family: var(--font-display); font-size: 1.5rem; font-weight: 600;">${escapeHTML(opt.label)}</span>
            </div>
            <div class="poll-pct" id="pct-${i}" style="font-family: var(--font-display); font-size: 1.5rem; font-weight: 700; z-index: 2; display: ${canSeeResults ? 'block' : 'none'};">0%</div>
            <div class="poll-bar" id="bar-${i}" style="position: absolute; top: 0; left: 0; height: 100%; width: ${canSeeResults ? '0%' : '0%'}; background-color: ${i===0 ? 'var(--red)' : 'var(--blue)'}; opacity: 0.2; transition: width 0.6s cubic-bezier(0.22, 1, 0.36, 1); z-index: 1;"></div>
          </button>
        `).join('')}
      </div>
    `;
  } else {
    // Multi-option poll
    const colors = ['var(--red)', 'var(--blue)', '#EAB308', '#22C55E', '#A855F7', '#F97316'];
    optionsHtml = `
      <div class="flex flex-col gap-1" id="poll-options-container">
        ${currentPoll.options.map((opt, i) => `
          <button class="tactile-border hard-shadow poll-opt-btn" data-idx="${i}" style="position: relative; overflow: hidden; padding: 1.5rem; background-color: var(--bg-color); cursor: pointer; text-align: left; display: flex; align-items: center; justify-content: space-between; outline: none;">
            <div style="display: flex; align-items: center; gap: 1rem; z-index: 2;">
              ${renderOptVisual(opt, '1.5rem')}
              <span style="font-family: var(--font-display); font-size: 1.2rem; font-weight: 600;">${escapeHTML(opt.label)}</span>
            </div>
            <div class="poll-pct" id="pct-${i}" style="font-family: var(--font-display); font-size: 1.2rem; font-weight: 700; z-index: 2; display: ${canSeeResults ? 'block' : 'none'};">0%</div>
            <div class="poll-bar" id="bar-${i}" style="position: absolute; top: 0; left: 0; height: 100%; width: ${canSeeResults ? '0%' : '0%'}; background-color: ${colors[i%colors.length]}; opacity: 0.2; transition: width 0.6s cubic-bezier(0.22, 1, 0.36, 1); z-index: 1;"></div>
          </button>
        `).join('')}
      </div>
    `;
  }

  containerEl.innerHTML = `
    <div class="container" style="max-width: 600px;" id="poll-render-card">
      <div style="padding: 2rem; background: var(--bg-color);" class="tactile-border">
        <h1 class="display-text text-center mb-1" style="font-size: 2rem;">${title}</h1>
        <div class="text-center">${desc}</div>
        ${optionsHtml}
        <div id="poll-feedback" class="mt-2 text-center" style="min-height: 80px;"></div>
      </div>
    </div>
  `;

  if (hasVoted) {
    handleVote(store.getVote(pollId), true);
  } else {
    document.querySelectorAll('.poll-opt-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.currentTarget.dataset.idx);
        handleVote(idx, false);
      });
    });
  }
}

function handleVote(choiceIdx, isReplay) {
  const allowChanging = currentPoll.allowChangingVote;

  const btns = document.querySelectorAll('.poll-opt-btn');
  btns.forEach(b => {
    if (!allowChanging) {
      b.disabled = true;
      b.style.cursor = 'default';
    }
    // reset visual state
    b.style.boxShadow = '';
    b.style.transform = '';
    b.style.border = '';
  });

  const selectedBtn = btns[choiceIdx];
  if(selectedBtn) {
    selectedBtn.style.boxShadow = 'var(--hard-shadow-active)';
    selectedBtn.style.transform = 'translate(4px, 4px)';
    selectedBtn.style.border = '2px solid var(--ink)';
  }

  if (!isReplay) {
    store.recordVote(pollId, choiceIdx);
  } else if (allowChanging) {
     // Rebind clicks if we allow changing and are just restoring state
     btns.forEach((b, i) => {
        b.onclick = () => handleVote(i, false);
     });
  }

  // Calculate local results (Since it's serverless, it's just 1 vote for the chosen option, 0 for others)
  // For visual effect, if we had previous votes we'd show them, but here the device is the source of truth for this user.
  const total = 1;

  import('../utils.js').then(({ animateCountUp, fireConfetti }) => {
    // Determine winner for tournament
    if (currentPoll.type === 'tournament' && !isReplay) {
        fireConfetti();
    }

    currentPoll.options.forEach((opt, i) => {
      const pct = i === choiceIdx ? 100 : 0;
      const pctEl = document.getElementById(`pct-${i}`);
      const barEl = document.getElementById(`bar-${i}`);
      const btn = document.querySelector(`.poll-opt-btn[data-idx="${i}"]`);

      if (pctEl) {
        pctEl.style.display = 'block';
        animateCountUp(pctEl, pct);
      }
      if (barEl) {
        setTimeout(() => {
          barEl.style.width = pct + '%';
        }, 50);
      }
      if (btn && i === choiceIdx && currentPoll.type !== 'tournament') {
        btn.style.setProperty('--flood-color', i === 0 ? 'rgba(217, 68, 42, 0.1)' : 'rgba(31, 79, 168, 0.1)');
        btn.classList.add('vote-locked');
      }
    });
  });

  const feedback = document.getElementById('poll-feedback');
  if (feedback) {
    setTimeout(() => {
      feedback.innerHTML = `
        <div aria-live="polite">
          <p class="mb-1" style="opacity: 0.8; font-size: 0.9rem;">
            Results on this device. 1or2 polls are serverless. Compare results with friends by sharing screenshots!
          </p>
        </div>
        <button id="download-result-btn" class="btn btn-primary hard-shadow">Share Result Card</button>
      `;
      const dlBtn = document.getElementById('download-result-btn');
      if(dlBtn) {
          dlBtn.addEventListener('click', () => shareResultCard(document.getElementById('poll-render-card')));
      }
    }, isReplay ? 0 : 800);
  }
}

// Result Card Generation
async function shareResultCard(elementToRender) {
  if (!elementToRender) return;

  // Create a canvas and draw basic representation.
  // For a truly robust client-side image generation without libraries like html2canvas,
  // we draw the DOM onto a canvas using SVG foreignObject trick or basic canvas API.
  // Given constraints, we will build a stylized canvas representation manually to ensure high quality and no external deps.

  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 800; // Fixed square for sharing
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#FAF4E8'; // var(--bg-color)
  ctx.fillRect(0, 0, 800, 800);

  // Grain simulation (simple dots)
  ctx.fillStyle = 'rgba(24, 21, 17, 0.05)';
  for (let i = 0; i < 4000; i++) {
    ctx.fillRect(Math.random() * 800, Math.random() * 800, 2, 2);
  }

  // Border
  ctx.strokeStyle = '#181511';
  ctx.lineWidth = 16;
  ctx.strokeRect(0, 0, 800, 800);

  // Title
  ctx.fillStyle = '#181511';
  ctx.font = 'bold 48px serif'; // Fraunces fallback
  ctx.textAlign = 'center';
  ctx.fillText(currentPoll.title || '1or2 Poll', 400, 100);

  // Subtitle
  ctx.font = '24px sans-serif'; // Archivo fallback
  ctx.fillStyle = 'rgba(24, 21, 17, 0.6)';
  ctx.fillText('1or2 — Settle it.', 400, 150);

  // Draw options
  const startY = 250;
  const itemHeight = 80;
  const gap = 20;

  if (currentPoll.type === 'tournament') {
     ctx.font = 'bold 120px sans-serif';
     const winner = currentPoll.options[store.getVote(pollId)] || currentPoll.options[0];
     ctx.fillText(winner.emoji, 400, 400);
     ctx.font = 'bold 64px serif';
     ctx.fillStyle = '#D9442A';
     ctx.fillText(winner.label, 400, 520);
     ctx.fillStyle = '#181511';
     ctx.font = 'bold 32px sans-serif';
     ctx.fillText('Tournament Champion', 400, 600);
  } else {
    currentPoll.options.forEach((opt, i) => {
      const y = startY + (i * (itemHeight + gap));
      const isWinner = store.getVote(pollId) === i;

      // Bar background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(100, y, 600, itemHeight);

      // Bar fill (simple logic: winner 100%, others 0%)
      if (isWinner) {
        ctx.fillStyle = i === 0 ? 'rgba(217, 68, 42, 0.2)' : (i === 1 ? 'rgba(31, 79, 168, 0.2)' : 'rgba(234, 179, 8, 0.2)');
        ctx.fillRect(100, y, 600, itemHeight);
      }

      // Box border
      ctx.strokeStyle = isWinner ? '#181511' : 'rgba(24, 21, 17, 0.2)';
      ctx.lineWidth = isWinner ? 4 : 2;
      ctx.strokeRect(100, y, 600, itemHeight);
      if (isWinner) {
         // Hard shadow
         ctx.fillStyle = '#181511';
         ctx.fillRect(104, y + itemHeight, 600, 4);
         ctx.fillRect(700, y + 4, 4, itemHeight);
      }

      // Text
      ctx.fillStyle = '#181511';
      ctx.font = 'bold 32px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(opt.emoji + '  ' + opt.label, 130, y + 50);

      // Pct
      ctx.textAlign = 'right';
      ctx.fillText(isWinner ? '100%' : '0%', 670, y + 50);
    });
  }

  // Footer
  ctx.textAlign = 'center';
  ctx.font = '24px sans-serif';
  ctx.fillStyle = 'rgba(24, 21, 17, 0.8)';
  ctx.fillText('Scan or click to play', 400, 750);

  // Convert to Blob
  canvas.toBlob(async (blob) => {
    if (!blob) return;

    // Web Share API support
    if (navigator.share && navigator.canShare) {
      const file = new File([blob], '1or2-result.png', { type: 'image/png' });
      if (navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            title: currentPoll.title,
            text: 'Check out the results on 1or2!',
            files: [file]
          });
          return;
        } catch (err) {
          console.warn('Share failed', err);
        }
      }
    }

    // Fallback: Download
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '1or2-result.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

  }, 'image/png');
}

// Tournament logic stubs (to keep file size manageable for now, MVP bracket implementation)
function initTournament() {
  bracketMatches = [];

  // Ensure we have exactly 4, 8, or 16 items for a clean bracket.
  // The creator studio enforces this, but robust decoding should check too.
  let validItems = [...currentPoll.options];
  const l = validItems.length;
  if (l > 8 && l < 16) validItems = validItems.slice(0, 8);
  else if (l > 4 && l < 8) validItems = validItems.slice(0, 4);
  else if (l < 4) return renderStandardPoll(); // Degrade if broken

  // Basic pairs for Round 1
  for (let i = 0; i < validItems.length; i += 2) {
    bracketMatches.push([validItems[i], validItems[i+1]]);
  }
  currentBracketIndex = 0;
  roundNumber = 1;
  renderTournamentMatch();
}

function renderTournamentMatch() {
  if (currentBracketIndex >= bracketMatches.length) {
    // Next round
    const winners = bracketMatches.map(m => m.winner);
    if (winners.length === 1) {
      renderTournamentWinner(winners[0]);
      return;
    }
    bracketMatches = [];
    for (let i = 0; i < winners.length; i += 2) {
      bracketMatches.push([winners[i], winners[i+1]]);
    }
    currentBracketIndex = 0;
    roundNumber++;
  }

  const match = bracketMatches[currentBracketIndex];

  const roundName = bracketMatches.length === 1 ? 'Finals' : (bracketMatches.length === 2 ? 'Semifinals' : `Round ${roundNumber}`);

  const renderOptVisual = (opt) => {
    if (opt.image) {
      return `<img src="${escapeHTML(opt.image)}" alt="Option image" style="width: 4rem; height: 4rem; object-fit: cover; border-radius: 4px; border: 1px solid var(--ink);" onerror="this.onerror=null; this.outerHTML='<span style=\\'font-size: 2rem;\\' aria-hidden=\\'true\\'>${opt.emoji}</span>'">`;
    }
    return `<span style="font-size: 2rem;" aria-hidden="true">${opt.emoji}</span>`;
  };

  containerEl.innerHTML = `
    <div class="container" style="max-width: 600px;">
      <div class="text-center mb-2">
        <h1 class="display-text" style="font-size: 2rem;">${escapeHTML(currentPoll.title)}</h1>
        <div class="badge majority mt-1">${roundName}</div>
      </div>
      <div class="flex flex-col gap-1" style="position: relative;">
        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 10; background: var(--bg-color); padding: 0.5rem; border-radius: 50%; font-family: var(--font-display); font-weight: 700; border: 2px solid var(--ink);">VS</div>

        <button class="tactile-border hard-shadow t-opt-btn" data-idx="0" style="padding: 2rem; background-color: var(--bg-color); cursor: pointer; text-align: left; display: flex; align-items: center; gap: 1rem; outline: none; border-color: var(--red);">
          ${renderOptVisual(match[0])}
          <span style="font-family: var(--font-display); font-size: 1.5rem; font-weight: 600;">${escapeHTML(match[0].label)}</span>
        </button>

        <button class="tactile-border hard-shadow t-opt-btn" data-idx="1" style="padding: 2rem; background-color: var(--bg-color); cursor: pointer; text-align: left; display: flex; align-items: center; gap: 1rem; outline: none; border-color: var(--blue);">
          ${renderOptVisual(match[1])}
          <span style="font-family: var(--font-display); font-size: 1.5rem; font-weight: 600;">${escapeHTML(match[1].label)}</span>
        </button>
      </div>
    </div>
  `;

  document.querySelectorAll('.t-opt-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idx = parseInt(e.currentTarget.dataset.idx);
      bracketMatches[currentBracketIndex].winner = match[idx];
      currentBracketIndex++;
      renderTournamentMatch();
    });
  });
}

function renderTournamentWinner(winner) {
  store.recordVote(pollId, currentPoll.options.findIndex(o => o.label === winner.label));
  import('../utils.js').then(({ fireConfetti }) => {
    fireConfetti();
  });

  containerEl.innerHTML = `
    <div class="container text-center tactile-border hard-shadow mt-2" style="padding: 3rem 1rem; max-width: 600px;" id="poll-render-card">
      <h2 class="display-text mb-1">Champion Crowned</h2>
      <div style="font-size: 4rem; margin: 1rem 0;">${winner.emoji}</div>
      <h1 class="display-text" style="font-size: 2.5rem; color: var(--red);">${escapeHTML(winner.label)}</h1>
      <p class="mt-2 mb-2">Wins the ${escapeHTML(currentPoll.title)} bracket!</p>
      <button id="download-result-btn" class="btn btn-primary hard-shadow">Share Result Card</button>
    </div>
  `;
  const dlBtn = document.getElementById('download-result-btn');
  if(dlBtn) {
      dlBtn.addEventListener('click', () => shareResultCard(document.getElementById('poll-render-card')));
  }
}
