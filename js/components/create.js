import { store } from '../store.js';
import { escapeHTML } from '../codec.js';

let containerEl = null;

// Base state for a new poll
export let pollDraft = {
  type: 'duel',
  title: '',
  description: '',
  category: '',
  seeResultsBefore: false,
  allowChangingVote: false,
  options: [
    { label: '', emoji: '🔴' },
    { label: '', emoji: '🔵' }
  ]
};

export function renderCreate(container) {
  containerEl = container;

  // Reset draft on load
  pollDraft = {
    type: 'duel',
    title: '',
    description: '',
    category: '',
    seeResultsBefore: false,
    allowChangingVote: false,
    options: [
      { label: '', emoji: '🔴' },
      { label: '', emoji: '🔵' }
    ]
  };

  renderLayout();
}

function renderLayout() {
  containerEl.innerHTML = `
    <div class="container" style="max-width: 1000px;">
      <h1 class="display-text mb-2 text-center" style="font-size: 2.5rem;">Create a Poll</h1>

      <div style="display: grid; grid-template-columns: 1fr; gap: 2rem; @media (min-width: 768px) { grid-template-columns: 1fr 1fr; }">

        <!-- Editor Column -->
        <div class="tactile-border hard-shadow" style="padding: 1.5rem; background-color: var(--bg-color);">
          <div class="form-group">
            <label class="form-label">Poll Type</label>
            <div class="flex gap-1" style="flex-wrap: wrap;">
              <button class="btn type-btn" data-type="duel" style="flex: 1; padding: 0.5rem; font-size: 0.9rem;">Duel</button>
              <button class="btn type-btn" data-type="poll" style="flex: 1; padding: 0.5rem; font-size: 0.9rem;">Poll</button>
              <button class="btn type-btn" data-type="tournament" style="flex: 1; padding: 0.5rem; font-size: 0.9rem;">Bracket</button>
              <button class="btn type-btn" data-type="verdict" style="flex: 1; padding: 0.5rem; font-size: 0.9rem;">Verdict</button>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="poll-title">Question / Title</label>
            <input type="text" id="poll-title" class="form-input" placeholder="e.g., Best pizza topping?" maxlength="100">
          </div>

          <div class="form-group">
            <label class="form-label" for="poll-desc">Description (Optional)</label>
            <input type="text" id="poll-desc" class="form-input" placeholder="Add context..." maxlength="200">
          </div>

          <div class="form-group" style="display: flex; gap: 1rem;">
             <div style="flex: 1;">
               <label class="form-label" for="poll-cat">Category Tag (Optional)</label>
               <input type="text" id="poll-cat" class="form-input" placeholder="e.g. food, tech" maxlength="20">
             </div>
          </div>

          <div class="form-group flex flex-col gap-1">
             <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                <input type="checkbox" id="poll-see-results" style="width: 1.25rem; height: 1.25rem; cursor: pointer;">
                <span style="font-weight: 600;">Voters can see results before voting</span>
             </label>
             <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                <input type="checkbox" id="poll-allow-change" style="width: 1.25rem; height: 1.25rem; cursor: pointer;">
                <span style="font-weight: 600;">Allow changing vote</span>
             </label>
          </div>

          <hr class="dotted-divider">

          <div id="options-editor">
             <!-- Options injected here -->
          </div>

          <div class="mt-2">
            <button id="publish-btn" class="btn btn-primary hard-shadow" style="width: 100%;">Create & Share</button>
          </div>
        </div>

        <!-- Preview Column -->
        <div style="display: flex; flex-direction: column;">
          <h3 class="display-text mb-1 text-center" style="font-size: 1.25rem; opacity: 0.6; text-transform: uppercase;">Live Preview</h3>
          <div id="live-preview" style="flex: 1; border: 2px dashed var(--ink); padding: 1rem; border-radius: 8px; display: flex; flex-direction: column; justify-content: center;">
             <!-- Preview injected here -->
          </div>
        </div>

      </div>
    </div>
  `;

  // Bind initial events
  document.querySelectorAll('.type-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      pollDraft.type = e.target.dataset.type;
      updateTypeSelection();
      renderOptionsEditor();
      updatePreview();
    });
  });

  document.querySelectorAll('.opt-img-input').forEach(input => {
    input.addEventListener('input', (e) => {
      const idx = parseInt(e.target.dataset.idx);
      pollDraft.options[idx].image = e.target.value;
      updatePreview();
    });
  });

  document.getElementById('poll-title').addEventListener('input', (e) => {
    pollDraft.title = e.target.value;
    updatePreview();
  });

  document.getElementById('poll-desc').addEventListener('input', (e) => {
    pollDraft.description = e.target.value;
    updatePreview();
  });

  document.getElementById('poll-cat').addEventListener('input', (e) => {
    pollDraft.category = e.target.value;
    updatePreview();
  });

  document.getElementById('poll-see-results').addEventListener('change', (e) => {
    pollDraft.seeResultsBefore = e.target.checked;
  });

  document.getElementById('poll-allow-change').addEventListener('change', (e) => {
    pollDraft.allowChangingVote = e.target.checked;
  });

  updateTypeSelection();
  renderOptionsEditor();
  updatePreview();

  document.getElementById('publish-btn').addEventListener('click', handlePublish);
}

import { encodePoll } from '../codec.js';

async function handlePublish() {
  const btn = document.getElementById('publish-btn');

  // Basic validation
  if (!pollDraft.title.trim()) {
    alert("Please enter a title for your poll.");
    return;
  }

  for (let i = 0; i < pollDraft.options.length; i++) {
    if (!pollDraft.options[i].label.trim()) {
      alert(`Please fill out label for Option ${i + 1}.`);
      return;
    }
  }

  btn.disabled = true;
  btn.textContent = 'Publishing...';

  try {
    const payloadStr = await encodePoll(pollDraft);
    store.addCreatedPoll(pollDraft, payloadStr);

    const shareUrl = `${window.location.origin}${window.location.pathname}#/p/${payloadStr}`;

    containerEl.innerHTML = `
      <div class="container text-center">
        <h1 class="display-text mb-2" style="font-size: 2.5rem;">Poll Created!</h1>
        <div class="tactile-border hard-shadow mb-2" style="padding: 2rem; background: var(--bg-color); display: inline-block; max-width: 100%;">
          <p class="mb-1" style="font-weight: 600;">Share this link for others to vote:</p>
          <input type="text" readonly value="${shareUrl}" class="form-input mb-1" style="text-align: center; font-family: monospace; background: rgba(0,0,0,0.05);" id="share-link-input">
          <div class="flex justify-center gap-1">
            <button id="copy-link-btn" class="btn btn-primary hard-shadow">Copy Link</button>
            <button id="native-share-btn" class="btn hard-shadow">Share</button>
          </div>
        </div>
        <p style="opacity: 0.8; margin-bottom: 2rem;">1or2 polls are serverless — each device counts its own votes. Compare results with friends by sharing screenshots.</p>
        <div>
           <a href="#/" class="btn">Back Home</a>
           <a href="#/p/${payloadStr}" class="btn btn-primary hard-shadow">View Poll</a>
        </div>
      </div>
    `;

    document.getElementById('copy-link-btn').addEventListener('click', (e) => {
      const input = document.getElementById('share-link-input');
      input.select();
      document.execCommand('copy');
      e.target.textContent = 'Copied! ✓';
      setTimeout(() => e.target.textContent = 'Copy Link', 2000);
    });

    const nativeBtn = document.getElementById('native-share-btn');
    if (navigator.share) {
      nativeBtn.addEventListener('click', () => {
        navigator.share({
          title: pollDraft.title,
          text: 'Vote on my 1or2 poll!',
          url: shareUrl
        }).catch(console.error);
      });
    } else {
      nativeBtn.style.display = 'none';
    }

  } catch (e) {
    console.error(e);
    alert('Failed to create poll. Check console.');
    btn.disabled = false;
    btn.textContent = 'Create & Share';
  }
}

export function updateTypeSelection() {
  document.querySelectorAll('.type-btn').forEach(btn => {
    if (btn.dataset.type === pollDraft.type) {
      btn.style.backgroundColor = 'var(--ink)';
      btn.style.color = 'var(--bg-color)';
    } else {
      btn.style.backgroundColor = 'transparent';
      btn.style.color = 'var(--ink)';
      btn.style.border = '2px solid var(--ink)';
    }
  });
}

export function renderOptionsEditor() {
  const editor = document.getElementById('options-editor');
  if(!editor) return;

  // Adjust draft options based on type
  if (pollDraft.type === 'duel') {
    if (pollDraft.options.length !== 2) pollDraft.options = [{ label: '', emoji: '🔴' }, { label: '', emoji: '🔵' }];
  } else if (pollDraft.type === 'verdict') {
    pollDraft.options = [{ label: 'Yes', emoji: '👍' }, { label: 'No', emoji: '👎' }];
  } else if (pollDraft.type === 'poll' && pollDraft.options.length < 3) {
    pollDraft.options = [{ label: '', emoji: '1️⃣' }, { label: '', emoji: '2️⃣' }, { label: '', emoji: '3️⃣' }];
  } else if (pollDraft.type === 'tournament' && pollDraft.options.length < 4) {
     pollDraft.options = [{ label: '', emoji: '🔴' }, { label: '', emoji: '🔵' }, { label: '', emoji: '🟢' }, { label: '', emoji: '🟡' }];
  }

  let html = `<label class="form-label mb-1">Options</label>`;
  if (pollDraft.type === 'tournament') {
     html += `<p style="font-size: 0.85rem; opacity: 0.8; margin-bottom: 1rem;">Tournaments require exactly 4, 8, or 16 items.</p>`;
  }
  html += `<div class="flex flex-col gap-1">`;

  pollDraft.options.forEach((opt, idx) => {
    const isLocked = pollDraft.type === 'verdict';
    html += `
      <div class="flex flex-col gap-1 tactile-border" style="padding: 1rem;">
        <div class="flex gap-1 items-center">
          <button class="btn emoji-btn tactile-border hard-shadow" data-idx="${idx}" aria-label="Change emoji for option ${idx + 1}" style="padding: 0.5rem; font-size: 1.5rem; min-width: 50px;" ${isLocked ? 'disabled' : ''}>${opt.emoji}</button>
          <input type="text" class="form-input opt-input" data-idx="${idx}" value="${opt.label}" placeholder="Option ${idx + 1} Label" maxlength="40" ${isLocked ? 'disabled' : ''}>
          ${(pollDraft.type === 'poll' || pollDraft.type === 'tournament') && pollDraft.options.length > 2 ?
            `<button class="btn btn-red remove-opt-btn hard-shadow" data-idx="${idx}" aria-label="Remove option ${idx + 1}" style="padding: 0.5rem;">×</button>` : ''}
        </div>
        <div class="flex gap-1 items-center">
          <input type="url" class="form-input opt-img-input" data-idx="${idx}" value="${opt.image || ''}" placeholder="Image URL (optional)" ${isLocked ? 'disabled' : ''} style="font-size: 0.85rem; padding: 0.5rem;">
        </div>
      </div>
    `;
  });

  html += `</div>`;

  if (pollDraft.type === 'poll' && pollDraft.options.length < 6) {
    html += `<button id="add-opt-btn" class="btn mt-1" style="width: 100%; border: 2px dashed var(--ink);">+ Add Option</button>`;
  }

  if (pollDraft.type === 'tournament' && pollDraft.options.length === 4) {
    html += `<button id="add-4-opt-btn" class="btn mt-1" style="width: 100%; border: 2px dashed var(--ink);">+ Add 4 more (make it 8)</button>`;
  } else if (pollDraft.type === 'tournament' && pollDraft.options.length === 8) {
    html += `<button id="add-8-opt-btn" class="btn mt-1" style="width: 100%; border: 2px dashed var(--ink);">+ Add 8 more (make it 16)</button>`;
  }

  editor.innerHTML = html;

  // Bind option events
  document.querySelectorAll('.opt-input').forEach(input => {
    input.addEventListener('input', (e) => {
      const idx = parseInt(e.target.dataset.idx);
      pollDraft.options[idx].label = e.target.value;
      updatePreview();
    });
  });

  const addBtn = document.getElementById('add-opt-btn');
  if (addBtn && pollDraft.type !== 'tournament') {
    addBtn.addEventListener('click', () => {
      pollDraft.options.push({ label: '', emoji: '✨' });
      renderOptionsEditor();
      updatePreview();
    });
  }

  const add4Btn = document.getElementById('add-4-opt-btn');
  if (add4Btn) {
    add4Btn.addEventListener('click', () => {
      for(let i=0; i<4; i++) pollDraft.options.push({ label: '', emoji: '✨' });
      renderOptionsEditor();
      updatePreview();
    });
  }

  const add8Btn = document.getElementById('add-8-opt-btn');
  if (add8Btn) {
    add8Btn.addEventListener('click', () => {
      for(let i=0; i<8; i++) pollDraft.options.push({ label: '', emoji: '✨' });
      renderOptionsEditor();
      updatePreview();
    });
  }

  document.querySelectorAll('.remove-opt-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idx = parseInt(e.target.dataset.idx);
      if (pollDraft.type === 'tournament') {
         // Prevent removing single items if it breaks bracket sizes.
         // Instead, we just handle the add/remove strictly.
         // For UX, if they remove one, we truncate to the next lowest valid bracket.
         if (pollDraft.options.length === 16) {
             pollDraft.options = pollDraft.options.slice(0, 8);
         } else if (pollDraft.options.length === 8) {
             pollDraft.options = pollDraft.options.slice(0, 4);
         }
      } else {
         pollDraft.options.splice(idx, 1);
      }
      renderOptionsEditor();
      updatePreview();
    });
  });

  // Simple emoji cycler for MVP (a full picker takes too much space, cycling common ones works well for tactile feel)
  const commonEmojis = ['🔴','🔵','🟢','🟡','👍','👎','🍕','🍔','🚗','✈️','🔥','💧','🌞','🌙','❤️','💔'];
  document.querySelectorAll('.emoji-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idx = parseInt(e.target.dataset.idx);
      const current = pollDraft.options[idx].emoji;
      let nextIdx = commonEmojis.indexOf(current) + 1;
      if (nextIdx >= commonEmojis.length) nextIdx = 0;
      pollDraft.options[idx].emoji = commonEmojis[nextIdx];
      renderOptionsEditor();
      updatePreview();
    });
  });
}

export function updatePreview() {
  const preview = document.getElementById('live-preview');
  if(!preview) return;

  const title = escapeHTML(pollDraft.title || 'Untitled Poll');
  const descHtml = pollDraft.description ? `<p style="margin-bottom: 0.5rem; opacity: 0.8;">${escapeHTML(pollDraft.description)}</p>` : '';
  const catHtml = pollDraft.category ? `<div class="badge underdog mb-1">${escapeHTML(pollDraft.category)}</div>` : '';

  let optionsHtml = '';

  const renderOptVisual = (opt) => {
    if (opt.image) {
      return `<img src="${escapeHTML(opt.image)}" alt="Option image" style="width: 3rem; height: 3rem; object-fit: cover; border-radius: 4px; border: 1px solid var(--ink);" onerror="this.onerror=null; this.outerHTML='<span style=\\'font-size: 1.5rem;\\'>${opt.emoji}</span>'">`;
    }
    return `<span style="font-size: 1.5rem;">${opt.emoji}</span>`;
  };

  if (pollDraft.type === 'duel' || pollDraft.type === 'verdict') {
    optionsHtml = `
      <div class="flex flex-col gap-1" style="position: relative;">
        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 10; background: var(--bg-color); padding: 0.5rem; border-radius: 50%; font-family: var(--font-display); font-weight: 700; border: 2px solid var(--ink);">OR</div>
        ${pollDraft.options.map((opt, i) => `
          <div class="tactile-border hard-shadow" style="padding: 1.5rem; background-color: var(--bg-color); text-align: left; display: flex; align-items: center; gap: 1rem; border-color: ${i===0 ? 'var(--red)' : 'var(--blue)'};">
             ${renderOptVisual(opt)}
             <span style="font-family: var(--font-display); font-weight: 600;">${escapeHTML(opt.label) || `Option ${i+1}`}</span>
          </div>
        `).join('')}
      </div>
    `;
  } else {
    optionsHtml = `
      <div class="flex flex-col gap-1">
        ${pollDraft.options.map((opt, i) => `
          <div class="tactile-border hard-shadow" style="padding: 1rem; background-color: var(--bg-color); text-align: left; display: flex; align-items: center; gap: 1rem;">
             ${renderOptVisual(opt)}
             <span style="font-family: var(--font-display); font-weight: 600;">${escapeHTML(opt.label) || `Option ${i+1}`}</span>
          </div>
        `).join('')}
      </div>
    `;
  }

  let extras = '';
  if (pollDraft.type === 'tournament') {
     extras = `<div class="mt-2 text-center badge">Bracket: ${pollDraft.options.length} Items</div>`;
  }

  preview.innerHTML = `
    <div style="pointer-events: none;">
      <h2 class="display-text mb-1" style="font-size: 1.5rem;">${title}</h2>
      ${descHtml}
      ${catHtml}
      ${optionsHtml}
      ${extras}
    </div>
  `;
}
