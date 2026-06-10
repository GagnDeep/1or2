import { store } from '../store.js';
import { escapeHTML } from '../codec.js';

let containerEl = null;

export function renderMine(container) {
  containerEl = container;
  renderLayout();
  renderCreatedTab(); // Default tab
}

function renderLayout() {
  containerEl.innerHTML = `
    <div class="container text-center">
      <h1 class="display-text mb-2" style="font-size: 2.5rem;">My Studio</h1>

      <div class="flex justify-center gap-1 mb-2" id="mine-tabs" style="border-bottom: 2px solid var(--ink); padding-bottom: 1rem;">
        <button class="btn mine-tab-btn active" data-tab="created" style="background: var(--ink); color: var(--bg-color);">Created</button>
        <button class="btn mine-tab-btn" data-tab="voted">Voted History</button>
        <button class="btn mine-tab-btn" data-tab="data">Data & Export</button>
      </div>

      <div id="mine-content" class="text-left" style="max-width: 600px; margin: 0 auto;">
         <!-- Tab content renders here -->
      </div>
    </div>
  `;

  document.querySelectorAll('.mine-tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.mine-tab-btn').forEach(b => {
        b.style.background = 'transparent';
        b.style.color = 'var(--ink)';
      });
      e.target.style.background = 'var(--ink)';
      e.target.style.color = 'var(--bg-color)';

      const tab = e.target.dataset.tab;
      if (tab === 'created') renderCreatedTab();
      else if (tab === 'voted') renderVotedTab();
      else if (tab === 'data') renderDataTab();
    });
  });
}

function renderCreatedTab() {
  const content = document.getElementById('mine-content');
  const polls = store.state.createdPolls;

  if (polls.length === 0) {
    content.innerHTML = `
      <div class="text-center tactile-border" style="padding: 3rem 1rem;">
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin: 0 auto 1rem;">
          <rect x="20" y="20" width="80" height="80" rx="4" stroke="var(--ink)" stroke-width="4"/>
          <line x1="40" y1="40" x2="80" y2="40" stroke="var(--ink)" stroke-width="4" stroke-linecap="round"/>
          <line x1="40" y1="60" x2="60" y2="60" stroke="var(--ink)" stroke-width="4" stroke-linecap="round"/>
          <circle cx="80" cy="80" r="12" fill="var(--red)" stroke="var(--ink)" stroke-width="4"/>
          <path d="M76 80L79 83L85 77" stroke="var(--bg-color)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <p style="opacity: 0.8; font-size: 1.1rem; margin-bottom: 1.5rem;">You haven't created any polls yet. The canvas is blank!</p>
        <a href="#/create" class="btn btn-red hard-shadow">Create a Poll</a>
      </div>
    `;
    return;
  }

  let html = `<div class="flex flex-col gap-1">`;
  polls.forEach(p => {
    const shareUrl = `${window.location.origin}${window.location.pathname}#/p/${p.payload}`;
    html += `
      <div class="tactile-border hard-shadow flex justify-between items-center" style="padding: 1rem; background: var(--bg-color);">
        <div>
          <div class="badge mb-1">${escapeHTML(p.type)}</div>
          <h3 class="display-text" style="font-size: 1.25rem;">${escapeHTML(p.title)}</h3>
          <p style="font-size: 0.85rem; opacity: 0.6;">${new Date(p.createdAt).toLocaleDateString()}</p>
        </div>
        <div class="flex flex-col gap-1">
          <a href="#/p/${p.payload}" class="btn" style="padding: 0.25rem 0.5rem; font-size: 0.8rem;">View</a>
          <button class="btn btn-primary copy-mine-btn" data-url="${shareUrl}" style="padding: 0.25rem 0.5rem; font-size: 0.8rem;">Copy Link</button>
          <button class="btn btn-red delete-mine-btn" data-id="${p.id}" style="padding: 0.25rem 0.5rem; font-size: 0.8rem;">Delete</button>
        </div>
      </div>
    `;
  });
  html += `</div>`;
  content.innerHTML = html;

  document.querySelectorAll('.copy-mine-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      navigator.clipboard.writeText(e.target.dataset.url);
      e.target.textContent = 'Copied!';
      setTimeout(() => e.target.textContent = 'Copy Link', 2000);
    });
  });

  document.querySelectorAll('.delete-mine-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      if(confirm('Delete this poll from your history?')) {
        store.deleteCreatedPoll(e.target.dataset.id);
        renderCreatedTab();
      }
    });
  });
}

function renderVotedTab() {
  const content = document.getElementById('mine-content');
  const votedKeys = Object.keys(store.state.votedPolls);

  if (votedKeys.length === 0) {
    content.innerHTML = `
      <div class="text-center tactile-border" style="padding: 3rem 1rem;">
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin: 0 auto 1rem;">
          <rect x="10" y="40" width="100" height="40" rx="20" stroke="var(--ink)" stroke-width="4"/>
          <circle cx="30" cy="60" r="12" fill="var(--blue)" stroke="var(--ink)" stroke-width="4"/>
          <path d="M50 60H90" stroke="var(--ink)" stroke-width="4" stroke-linecap="round" stroke-dasharray="4 4"/>
        </svg>
        <p style="opacity: 0.8; font-size: 1.1rem; margin-bottom: 1.5rem;">You haven't voted on any polls yet. Time to settle some debates!</p>
        <a href="#/decks" class="btn btn-primary hard-shadow">Play Classics</a>
      </div>
    `;
    return;
  }

  content.innerHTML = `
    <div class="text-center mb-2">
      <h2 class="display-text">Total Votes Cast: ${store.state.user.totalVotes}</h2>
      <p style="opacity: 0.8;">Note: Serverless poll details are not stored locally to save space, only your choices.</p>
    </div>
    <div class="flex flex-col gap-1">
      ${votedKeys.slice(0, 50).map(k => `
        <div class="tactile-border" style="padding: 1rem; display: flex; justify-content: space-between;">
           <span style="font-family: monospace; font-size: 0.8rem;">ID: ${k.substring(0, 10)}...</span>
           <span class="badge">Choice: ${store.state.votedPolls[k].choiceIndex}</span>
        </div>
      `).join('')}
    </div>
  `;
}

function renderDataTab() {
  const content = document.getElementById('mine-content');

  content.innerHTML = `
    <div class="tactile-border hard-shadow" style="padding: 2rem; background: var(--bg-color); text-align: center;">
      <h2 class="display-text mb-1">Your Data</h2>
      <p class="mb-2">1or2 is serverless. All your created polls and voting history live exclusively on this device. You can export it for backup or to move to another device.</p>

      <div class="flex flex-col gap-1 items-center">
        <button id="export-btn" class="btn btn-primary hard-shadow" style="width: 100%; max-width: 300px;">Export Data (JSON)</button>

        <div style="width: 100%; max-width: 300px; position: relative;">
          <input type="file" id="import-file" style="opacity: 0; position: absolute; top: 0; left: 0; width: 100%; height: 100%; cursor: pointer;" accept=".json">
          <button class="btn hard-shadow" style="width: 100%; pointer-events: none;">Import Data</button>
        </div>
      </div>
    </div>
  `;

  document.getElementById('export-btn').addEventListener('click', () => {
    store.exportData();
  });

  document.getElementById('import-file').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      if (store.importData(e.target.result)) {
        alert('Data imported successfully!');
        renderCreatedTab();
        document.querySelector('.mine-tab-btn[data-tab="created"]').click();
      } else {
        alert('Invalid data file.');
      }
    };
    reader.readAsText(file);
  });
}
