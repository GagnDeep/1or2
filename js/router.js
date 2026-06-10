export function initRouter() {
  window.addEventListener('hashchange', handleRoute);
  handleRoute(); // initial
}

async function handleRoute() {
  const hash = window.location.hash || '#/';
  const appContainer = document.getElementById('app');
  appContainer.innerHTML = ''; // clear

  try {
    if (hash === '#/') {
      const { renderHome } = await import('./components/home.js');
      renderHome(appContainer);
    } else if (hash === '#/decks') {
      const { renderDecks } = await import('./components/decks.js');
      renderDecks(appContainer);
    } else if (hash === '#/create') {
      const { renderCreate } = await import('./components/create.js');
      renderCreate(appContainer);
    } else if (hash === '#/mine') {
      const { renderMine } = await import('./components/mine.js');
      renderMine(appContainer);
    } else if (hash.startsWith('#/p/')) {
      const payload = hash.substring(4);
      const { renderPlay } = await import('./components/play.js');
      renderPlay(appContainer, payload);
    } else {
      // 404
      const { renderHome } = await import('./components/home.js');
      renderHome(appContainer);
    }
  } catch (err) {
    console.error('Failed to load route:', err);
    appContainer.innerHTML = '<div class="container text-center mt-2"><h2>Failed to load view.</h2></div>';
  }
}
