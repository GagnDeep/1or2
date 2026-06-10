import { initRouter } from './router.js';

// Global Event Listeners (e.g. Keyboard hints)
document.addEventListener('keydown', (e) => {
  // Global keyboard shortcuts for voting if a poll is active
  // Since we don't have a single global "vote" function anymore,
  // we trigger clicks on the buttons if they exist

  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

  if (e.key === '1') {
    const opt1 = document.getElementById('deck-opt-1') || document.querySelector('.poll-opt-btn[data-idx="0"]') || document.querySelector('.t-opt-btn[data-idx="0"]');
    if (opt1 && !opt1.disabled) opt1.click();
  } else if (e.key === '2') {
    const opt2 = document.getElementById('deck-opt-2') || document.querySelector('.poll-opt-btn[data-idx="1"]') || document.querySelector('.t-opt-btn[data-idx="1"]');
    if (opt2 && !opt2.disabled) opt2.click();
  } else if (e.key === '3') {
    const opt3 = document.querySelector('.poll-opt-btn[data-idx="2"]');
    if (opt3 && !opt3.disabled) opt3.click();
  } else if (e.key === '4') {
    const opt4 = document.querySelector('.poll-opt-btn[data-idx="3"]');
    if (opt4 && !opt4.disabled) opt4.click();
  } else if (e.key === 'Enter' || e.key === 'ArrowRight') {
    const nextBtn = document.getElementById('deck-next-btn') || document.getElementById('download-result-btn');
    if (nextBtn) nextBtn.click();
  }
});

// Boot
document.addEventListener('DOMContentLoaded', () => {
  initRouter();
});
