import { store } from '../store.js';

export function renderHome(container) {
  const stats = store.state.user;
  const agreement = stats.totalVotes === 0 ? 0 : Math.round((stats.majorityMatches / stats.totalVotes) * 100);

  container.innerHTML = `
    <main class="container text-center">
      <h1 class="display-text mt-2" style="font-size: 3.5rem; line-height: 1.1;">Settle it.<br>1 or 2.</h1>
      <p class="mb-2" style="font-size: 1.25rem; opacity: 0.8; max-width: 500px; margin-left: auto; margin-right: auto;">
        The definitive serverless poll platform. Create beautiful tactile polls and share them instantly.
      </p>

      <div class="flex flex-col gap-1 items-center mb-2">
        <a href="#/create" class="btn btn-red hard-shadow" style="width: 100%; max-width: 300px; font-size: 1.25rem;">Create a Poll</a>
        <a href="#/decks" class="btn btn-primary hard-shadow" style="width: 100%; max-width: 300px; font-size: 1.25rem;">Play Classics</a>
      </div>

      <hr class="dotted-divider">

      <h2 class="display-text mb-1">Your Voted Record</h2>
      <div class="flex justify-center gap-1" style="flex-wrap: wrap;">
        <div class="tactile-border" style="padding: 1rem; width: 120px;">
          <div class="display-text" style="font-size: 2rem;">${stats.totalVotes}</div>
          <div style="font-size: 0.85rem; font-weight: 600; text-transform: uppercase;">Votes Cast</div>
        </div>
        <div class="tactile-border" style="padding: 1rem; width: 120px;">
          <div class="display-text" style="font-size: 2rem;">${agreement}%</div>
          <div style="font-size: 0.85rem; font-weight: 600; text-transform: uppercase;">Agreement</div>
        </div>
        <div class="tactile-border" style="padding: 1rem; width: 120px;">
          <div class="display-text" style="font-size: 2rem;">${stats.bestStreak}</div>
          <div style="font-size: 0.85rem; font-weight: 600; text-transform: uppercase;">Best Streak</div>
        </div>
      </div>
    </main>
  `;
}
