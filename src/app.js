import { media, photo } from './data.js';
import { findMedia, formatDate } from './model.js';

const app = document.querySelector('#app');
const state = { page: 'home', query: '', type: 'all', album: null, selected: null, offline: false, index: 'partial', favorites: new Set(), albums: ['Japan notes', 'Mountain light', 'Coastlines', 'Everyday'] };

const icon = (name, size = 20) => {
  const paths = {
    search: '<circle cx="11" cy="11" r="7"/><path d="m16 16 5 5"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/><path d="M9 21v-7h6v7"/>',
    album: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 2h10M7 9h10M7 13h7"/>',
    heart: '<path d="M20.8 8.6c0 4.1-8.8 10.8-8.8 10.8S3.2 12.7 3.2 8.6a4.7 4.7 0 0 1 8.8-2.2 4.7 4.7 0 0 1 8.8 2.2z"/>',
    arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
    close: '<path d="M5 5 19 19M19 5 5 19"/>',
    chevron: '<path d="m9 18 6-6-6-6"/>',
    plus: '<path d="M12 4v16M4 12h16"/>',
    download: '<path d="M12 3v12m-4-4 4 4 4-4M4 18v3h16v-3"/>',
    video: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="m10 9 5 3-5 3z"/>',
  };
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]}</svg>`;
};
const escapeHtml = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const viewerItems = () => state.page === 'all' ? findMedia(state.query, state.type, state.album) : state.page === 'search' ? findMedia(state.query, state.type) : state.page === 'favorites' ? media.filter(item => state.favorites.has(item.id)) : media;
function moveViewer(step) { const items = viewerItems(); const i = items.findIndex(item => item.id === state.selected); if (i >= 0 && items.length > 1) { const focused = document.activeElement?.dataset.step; const favoriteFocused = document.activeElement?.dataset.favorite !== undefined; state.selected = items[(i + step + items.length) % items.length].id; render(); if (focused) document.querySelector(`[data-step="${focused}"]`)?.focus(); else if (favoriteFocused) document.querySelector('[data-favorite]')?.focus(); } }
function closeViewer() { const id = state.selected; state.selected = null; render(); const card = document.querySelector(`[data-open="${id}"]`); const activeNav = [...document.querySelectorAll('.nav-item.active')].find(el => el.getClientRects().length); (card || activeNav)?.focus(); }
function focusHeading() { const heading = document.querySelector('#main h1'); if (heading) { heading.tabIndex = -1; heading.focus(); } }
function navigate(page) { state.page = page; state.album = null; state.query = ''; state.type = 'all'; state.selected = null; render(); window.scrollTo(0, 0); if (page === 'search') document.querySelector('#main-search')?.focus(); else focusHeading(); }

function navButton(page, label, symbol) {
  return `<button class="nav-item ${state.page === page ? 'active' : ''}" data-page="${page}" ${state.page === page ? 'aria-current="page"' : ''}>${icon(symbol)}<span>${label}</span></button>`;
}

function mediaCard(item, extra = '') {
  return `<button class="media-card ${extra}" data-open="${item.id}" aria-label="Open ${escapeHtml(item.title)}, ${escapeHtml(item.type)} from ${escapeHtml(item.place)}">
    <img src="${photo(item)}" alt="Sample photograph: ${escapeHtml(item.title)}" loading="lazy" />
    ${item.type === 'video' ? `<span class="video-indicator">${icon('video', 16)} Sample video</span>` : ''}
    <span class="card-caption"><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.place)}</small></span>
  </button>`;
}

function grid(items) {
  if (!items.length) {
    if (state.album && !state.query && state.type !== 'all' && findMedia('', 'all', state.album).length) return `<div class="empty"><span class="empty-icon">${icon('album', 26)}</span><h2>No sample ${state.type === 'video' ? 'videos' : 'photos'} in this album</h2><p>Other media may still be here.</p><button class="text-action" data-type="all">Show all types ${icon('arrow', 17)}</button></div>`;
    if (state.album && !state.query) return `<div class="empty"><span class="empty-icon">${icon('album', 26)}</span><h2>This sample album is empty</h2><p>Album editing and adding media are part of a later phase. Explore the other sample collections for now.</p><button class="text-action" data-page="albums">Browse albums ${icon('arrow', 17)}</button></div>`;
    return `<div class="empty"><span class="empty-icon">${icon('search', 26)}</span><h2>No sample matches</h2><p>Try a place, date, or a simpler description. This prototype searches fixture labels only.</p><button class="text-action" data-clear>Clear search ${icon('arrow', 17)}</button></div>`;
  }
  return `<div class="media-grid">${items.map(item => mediaCard(item)).join('')}</div>`;
}

function home() {
  const feature = media[0];
  return `<section class="intro"><div><span class="eyebrow">YOUR SPACE · SAMPLE LIBRARY</span><h1>A place for what<br /><em>matters to you.</em></h1><p>Find a moment, follow a memory, or simply wander.</p></div><button class="intro-link" data-page="all">Explore all media ${icon('arrow', 18)}</button></section>
    <div class="feature-layout"><button class="feature" data-open="${feature.id}" aria-label="Open sample moment ${escapeHtml(feature.title)}"><img src="${photo(feature, 1600)}" alt="Sample photograph: a quiet street" /><span class="feature-label"><small>RECENT MOMENT</small><strong>${escapeHtml(feature.title)}</strong><span>${escapeHtml(feature.place)} · ${formatDate(feature.date)}</span></span></button>
    <div class="feature-side"><div class="section-kicker">A LITTLE MORE TO EXPLORE</div><h2>Collected along<br />the way.</h2><p>Your albums, in one quiet place. Make room for a new story whenever you like.</p><button class="outline-action" data-page="albums">Browse albums ${icon('arrow', 17)}</button><div class="feature-count"><strong>04</strong><span>sample collections</span></div></div></div>
    <section class="section"><div class="section-head"><div><span class="eyebrow">THE LATEST</span><h2>Recent moments</h2></div><button class="text-action" data-page="all">View all ${icon('arrow', 17)}</button></div>${grid(media.slice(1, 5))}</section>`;
}

function allMedia() {
  const items = findMedia(state.query, state.type, state.album);
  return `<section class="page-heading"><div><span class="eyebrow">EVERYTHING IN ONE PLACE</span><h1>${state.album ? escapeHtml(state.album) : 'All media'}</h1><p>${items.length} sample ${items.length === 1 ? 'item' : 'items'} · Fixture labels only</p></div>${state.album ? '<button class="outline-action" data-page="albums">All albums</button>' : ''}</section>
    <div class="filter-row" role="group" aria-label="Media type filters"><button class="filter ${state.type === 'all' ? 'selected' : ''}" aria-pressed="${state.type === 'all'}" data-type="all">All</button><button class="filter ${state.type === 'photo' ? 'selected' : ''}" aria-pressed="${state.type === 'photo'}" data-type="photo">Photos</button><button class="filter ${state.type === 'video' ? 'selected' : ''}" aria-pressed="${state.type === 'video'}" data-type="video">Videos</button></div>
    ${grid(items)}`;
}

function albums() {
  return `<section class="page-heading"><div><span class="eyebrow">CURATED BY YOU</span><h1>Albums</h1><p>Small collections for the moments you return to.</p></div><button class="outline-action" data-create>${icon('plus', 17)} New sample album</button></section>
    <div class="album-grid">${state.albums.map(name => { const items = media.filter(item => item.album === name); const cover = items[0]; return `<button class="album-card" data-album="${escapeHtml(name)}"><span class="album-cover ${cover ? '' : 'album-cover-empty'}">${cover ? `<img src="${photo(cover)}" alt="" loading="lazy" />` : `${icon('album', 30)}<span>Empty sample album</span>`}</span><span class="album-title">${escapeHtml(name)} ${icon('arrow', 18)}</span><span class="album-meta">${items.length} sample ${items.length === 1 ? 'item' : 'items'}</span></button>`; }).join('')}</div>`;
}

function searchPage() {
  return `<section class="page-heading"><div><span class="eyebrow">FIND YOUR WAY BACK</span><h1>Search</h1><p>Begin with a place, a date, or what you remember.</p></div></section>
    <div class="search-large">${icon('search', 24)}<input id="main-search" type="search" placeholder="Try ‘Kyoto’, ‘mountains’, or ‘2026’" value="${escapeHtml(state.query)}" aria-label="Search sample media" autocomplete="off" /></div>
    <div class="index-note"><span class="note-dot"></span><div><strong>Sample indexing state: ${state.index === 'partial' ? 'incomplete' : 'complete'}</strong><p>${state.index === 'partial' ? 'In a real library, results may be partial while trusted devices build and sync their indexes.' : 'This still searches only fixture labels. Semantic, face, and OCR search are not connected.'}</p></div><button class="note-toggle" data-index>Switch sample state</button></div>
    <div id="search-results" aria-live="polite">${searchResults()}</div>`;
}

function searchResults() {
  if (state.query) { const items = findMedia(state.query, state.type); return `<div class="section-head results-head"><div><span class="eyebrow">SAMPLE RESULTS</span><h2>${items.length} found</h2></div></div>${grid(items)}`; }
  return `<div class="suggestions"><span class="eyebrow">SOMEWHERE TO START</span><div>${['Kyoto', 'Mountains', 'Coast', '2026'].map(t => `<button data-suggest="${t}">${t} ${icon('arrow', 15)}</button>`).join('')}</div></div>`;
}

function favorites() {
  const items = media.filter(item => state.favorites.has(item.id));
  return `<section class="page-heading"><div><span class="eyebrow">KEEP CLOSE</span><h1>Favorites</h1><p>Sample changes reset when the page reloads.</p></div></section>${items.length ? grid(items) : `<div class="empty"><span class="empty-icon">${icon('heart', 26)}</span><h2>Nothing saved yet</h2><p>Open a sample moment and choose Favorite. Your choice resets on reload.</p><button class="text-action" data-page="all">Browse all media ${icon('arrow', 17)}</button></div>`}`;
}

function viewer() {
  const item = media.find(x => x.id === state.selected);
  if (!item) return '';
  const items = viewerItems(); const idx = items.findIndex(x => x.id === item.id);
  return `<div class="viewer" role="dialog" aria-modal="true" aria-label="${escapeHtml(item.title)}" id="viewer"><div class="viewer-top"><button class="icon-button" data-close aria-label="Close viewer">${icon('close', 23)}</button><span>Sample media · ${idx + 1} of ${items.length}</span><button class="viewer-favorite ${state.favorites.has(item.id) ? 'is-favorite' : ''}" data-favorite="${item.id}" aria-pressed="${state.favorites.has(item.id)}">${icon('heart', 19)} ${state.favorites.has(item.id) ? 'Favorited' : 'Favorite'}</button></div><div class="viewer-body"><button class="viewer-arrow previous" data-step="-1" aria-label="Previous item" ${items.length < 2 ? 'disabled' : ''}>${icon('chevron', 26)}</button><img src="${photo(item, 1800)}" alt="Sample ${item.type === 'video' ? 'video poster' : 'photograph'}: ${escapeHtml(item.title)}" /><button class="viewer-arrow" data-step="1" aria-label="Next item" ${items.length < 2 ? 'disabled' : ''}>${icon('chevron', 26)}</button></div><div class="viewer-bottom"><div><span class="eyebrow">${escapeHtml(item.type.toUpperCase())} · SAMPLE</span><h2>${escapeHtml(item.title)}</h2><p>${escapeHtml(item.place)} · ${formatDate(item.date)}</p></div><span class="availability">${item.type === 'video' ? 'Sample poster · video playback not connected' : state.offline ? 'Sample preview · simulated offline · original not connected' : 'Sample preview · original not connected'}</span></div></div>`;
}

function render() {
  document.body.classList.toggle('viewer-open', Boolean(state.selected));
  app.innerHTML = `<div class="layout"><aside class="sidebar"><div class="brand"><span class="brand-mark">N<span>✳</span></span><span>NEXO <small>GALLERY</small></span></div><div class="nav-group"><span class="nav-label">LIBRARY</span>${navButton('home', 'Home', 'home')}${navButton('all', 'All media', 'grid')}${navButton('albums', 'Albums', 'album')}${navButton('favorites', 'Favorites', 'heart')}</div><div class="sidebar-bottom"><div class="sidebar-caption">A quieter way to remember.</div><div class="sample-indicator"><span></span> Prototype · sample media</div></div></aside>
    <div class="main-column"><header class="topbar"><button class="mobile-brand" data-page="home" aria-label="Nexo Gallery home">N<span>✳</span></button><button class="top-search" data-page="search">${icon('search', 19)} <span>Search your gallery</span><kbd>⌘ K</kbd></button><div class="top-actions"><button class="availability-control" data-offline aria-pressed="${state.offline}" title="Toggle simulated home server state"><span class="status-dot ${state.offline ? 'offline' : ''}"></span>${state.offline ? 'Simulated offline' : 'Simulated online'}</button><span class="avatar" aria-label="Personal space">A</span></div></header><main id="main">${state.page === 'home' ? home() : state.page === 'all' ? allMedia() : state.page === 'albums' ? albums() : state.page === 'favorites' ? favorites() : searchPage()}</main><footer class="footer">NEXO GALLERY <span>Prototype · all content and status are sample data</span></footer></div>
    <nav class="mobile-nav" aria-label="Main navigation">${navButton('home', 'Home', 'home')}${navButton('all', 'All media', 'grid')}${navButton('search', 'Search', 'search')}${navButton('albums', 'Albums', 'album')}${navButton('favorites', 'Favorites', 'heart')}</nav></div>${state.selected ? viewer() : ''}`;
  if (state.selected) { document.querySelector('.layout').inert = true; document.querySelector('[data-close]')?.focus(); }
}

app.addEventListener('click', event => {
  const target = event.target.closest('button');
  if (!target) return;
  if (target.dataset.page) { navigate(target.dataset.page); }
  else if (target.dataset.open) { state.selected = target.dataset.open; render(); }
  else if (target.dataset.close !== undefined) { closeViewer(); }
  else if (target.dataset.step) { moveViewer(Number(target.dataset.step)); }
  else if (target.dataset.favorite) { const wasFavorite = state.favorites.has(target.dataset.favorite); wasFavorite ? state.favorites.delete(target.dataset.favorite) : state.favorites.add(target.dataset.favorite); if (state.page === 'favorites' && wasFavorite) closeViewer(); else { render(); document.querySelector('[data-favorite]')?.focus(); } }
  else if (target.dataset.type) { state.type = target.dataset.type; render(); document.querySelector(`[data-type="${state.type}"]`)?.focus(); }
  else if (target.dataset.album) { state.album = target.dataset.album; state.page = 'all'; render(); focusHeading(); }
  else if (target.dataset.suggest) { state.query = target.dataset.suggest; render(); document.querySelector('#main-search')?.focus(); }
  else if (target.dataset.clear !== undefined) { state.query = ''; state.type = 'all'; render(); (document.querySelector('#main-search') || document.querySelector('[data-type="all"]'))?.focus(); }
  else if (target.dataset.offline !== undefined) { state.offline = !state.offline; render(); document.querySelector('[data-offline]')?.focus(); }
  else if (target.dataset.index !== undefined) { state.index = state.index === 'partial' ? 'complete' : 'partial'; render(); document.querySelector('[data-index]')?.focus(); }
  else if (target.dataset.create !== undefined) { const name = prompt('Name a sample album (resets on reload)'); if (name?.trim() && !state.albums.includes(name.trim())) { state.albums.unshift(name.trim()); render(); [...document.querySelectorAll('[data-album]')].find(button => button.dataset.album === name.trim())?.focus(); } }
});

app.addEventListener('input', event => {
  if (event.target.id !== 'main-search') return;
  state.query = event.target.value;
  document.querySelector('#search-results').innerHTML = searchResults();
});

document.addEventListener('keydown', event => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k' && !state.selected) { event.preventDefault(); navigate('search'); }
  if (!state.selected) return;
  if (event.key === 'Escape') { closeViewer(); }
  if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') moveViewer(event.key === 'ArrowRight' ? 1 : -1);
  if (event.key === 'Tab') { const controls = [...document.querySelectorAll('#viewer button:not(:disabled)')]; const first = controls[0], last = controls.at(-1); if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); } else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); } }
});

render();
