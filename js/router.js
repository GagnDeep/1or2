import { renderHome } from './components/home.js';
import { renderDecks } from './components/decks.js';
import { renderCreate } from './components/create.js';
import { renderPlay } from './components/play.js';
import { renderMine } from './components/mine.js';

export function initRouter() {
  window.addEventListener('hashchange', handleRoute);
  handleRoute(); // initial
}

function handleRoute() {
  const hash = window.location.hash || '#/';
  const appContainer = document.getElementById('app');
  appContainer.innerHTML = ''; // clear

  if (hash === '#/') {
    renderHome(appContainer);
  } else if (hash === '#/decks') {
    renderDecks(appContainer);
  } else if (hash === '#/create') {
    renderCreate(appContainer);
  } else if (hash === '#/mine') {
    renderMine(appContainer);
  } else if (hash.startsWith('#/p/')) {
    const payload = hash.substring(4);
    renderPlay(appContainer, payload);
  } else {
    // 404
    renderHome(appContainer);
  }
}
