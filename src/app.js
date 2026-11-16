import { media, photo } from './data.js';
import { findMedia, formatDate } from './model.js';

const app = document.querySelector('#app');

function initialTheme() {
  try {
    const saved = localStorage.getItem('nexo-gallery-theme');
    if (saved === 'light' || saved === 'dark') return saved;
  } catch { /* Storage may be unavailable in a local preview. */ }
  return window.matchMedia?.('(prefers-color-scheme: dark)')?.matches ? 'dark' : 'light';
}

const state = {
  page: 'all', query: '', type: 'all', album: null, grouping: 'all',
  selected: null, viewerOpener: null, viewerChrome: true, viewerInfo: false,
  theme: initialTheme(), favorites: new Set(),
  albums: ['Japan notes', 'Mountain light', 'Coastlines', 'Everyday'],
};
document.documentElement.dataset.theme = state.theme;

const paths = {
  photos: '<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m4 17 5-5 3 3 3-4 5 6"/>',
  albums: '<rect x="4" y="5" width="16" height="16" rx="2"/><path d="M7 2h10M8 10h8M8 14h8"/>',
  heart: '<path d="M20.8 8.6c0 4.1-8.8 10.8-8.8 10.8S3.2 12.7 3.2 8.6a4.7 4.7 0 0 1 8.8-2.2 4.7 4.7 0 0 1 8.8 2.2z"/>',
  search: '<circle cx="10.8" cy="10.8" r="7.2"/><path d="m16.2 16.2 4.4 4.4"/>',
  back: '<path d="m14.5 4.5-7.5 7.5 7.5 7.5"/>',
  next: '<path d="m9.5 4.5 7.5 7.5-7.5 7.5"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 10.5v5.5M12 7.5h.01"/>',
  video: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="m10 9 5 3-5 3z"/>',
  moon: '<path d="M20.5 15.7A8.5 8.5 0 0 1 8.3 3.5 8.5 8.5 0 1 0 20.5 15.7z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
};
const icon = (name, size = 20) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]}</svg>`;
const escapeHtml = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const monthOf = date => new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(new Date(`${date}T12:00:00Z`));
const viewerItems = () => state.page === 'all' ? findMedia(state.query, state.type, state.album) : state.page === 'search' ? findMedia(state.query) : state.page === 'favorites' ? media.filter(item => state.favorites.has(item.id)) : media;

function navButton(page, label, symbol) {
  return `<button class="nav-item ${state.page === page && !state.album ? 'active' : ''}" data-page="${page}" ${state.page === page && !state.album ? 'aria-current="page"' : ''}>${icon(symbol, 21)}<span>${label}</span></button>`;
}

function tile(item) {
  return `<button class="media-card" data-open="${item.id}" aria-label="Open ${escapeHtml(item.title)}, ${escapeHtml(item.type)} from ${escapeHtml(item.place)}">
    <img src="${photo(item, 700)}" alt="" loading="lazy" />
    ${item.type === 'video' ? `<span class="video-indicator" aria-hidden="true">${icon('video', 16)}</span>` : ''}
  </button>`;
}

function empty(message, detail, action, actionAttrs = 'data-page="all"') {
  return `<div class="empty"><span class="empty-symbol">${icon('photos', 29)}</span><h2>${message}</h2><p>${detail}</p><button class="text-action" ${actionAttrs}>${action}</button></div>`;
}

function mediaGrid(items) {
  return items.length ? `<div class="media-grid">${items.map(tile).join('')}</div>` : empty('No matching moments', 'Try a different search or filter. This is a sample library.', 'Clear filters', 'data-clear');
}

function mediaGroups(items) {
  if (state.grouping === 'all' || state.album || state.page !== 'all') {
    return `<section class="library-section"><div class="section-heading"><h2>${state.album ? 'Photos and videos' : '2026'}</h2><span>${items.length} ${items.length === 1 ? 'item' : 'items'}</span></div>${mediaGrid(items)}</section>`;
  }
  const groups = new Map();
  for (const item of items) {
    const month = monthOf(item.date);
    if (!groups.has(month)) groups.set(month, []);
    groups.get(month).push(item);
  }
  return [...groups].map(([month, group]) => `<section class="library-section"><div class="section-heading"><h2>${month}</h2><span>${group.length} ${group.length === 1 ? 'item' : 'items'}</span></div>${mediaGrid(group)}</section>`).join('');
}

function library() {
  const items = findMedia('', state.type, state.album);
  const title = state.album || 'Photos';
  return `<header class="page-heading"><div>${state.album ? '<button class="back-link" data-page="albums">' + icon('back', 17) + ' Albums</button>' : '<span class="eyebrow">SAMPLE LIBRARY</span>'}<h1>${escapeHtml(title)}</h1><p>${items.length} sample ${items.length === 1 ? 'item' : 'items'} · Your real library is not connected</p></div><button class="header-search" data-page="search" aria-label="Search photos">${icon('search', 22)}</button></header>
    <div class="library-toolbar"><div class="filter-row" role="group" aria-label="Media type filters">${['all', 'photo', 'video'].map(type => `<button class="filter ${state.type === type ? 'selected' : ''}" data-type="${type}" aria-pressed="${state.type === type}">${type === 'all' ? 'All' : type === 'photo' ? 'Photos' : 'Videos'}</button>`).join('')}</div>${state.album ? '' : `<div class="view-row" role="group" aria-label="Group photos"><button class="view-option ${state.grouping === 'all' ? 'selected' : ''}" data-group="all" aria-pressed="${state.grouping === 'all'}">All</button><button class="view-option ${state.grouping === 'months' ? 'selected' : ''}" data-group="months" aria-pressed="${state.grouping === 'months'}">Months</button></div>`}</div>
    ${items.length ? mediaGroups(items) : state.album && state.type !== 'all' && findMedia('', 'all', state.album).length ? empty(`No ${state.type === 'video' ? 'videos' : 'photos'} here`, 'This sample album has other media.', 'Show all media', 'data-type="all"') : state.album ? empty('This sample album is empty', 'Album editing and real imports come later.', 'Browse albums', 'data-page="albums"') : mediaGrid(items)}`;
}

function albums() {
  return `<header class="page-heading"><div><span class="eyebrow">SAMPLE COLLECTIONS</span><h1>Albums</h1><p>Moments grouped for an easier way back.</p></div></header><div class="album-grid">${state.albums.map(name => {
    const items = media.filter(item => item.album === name);
    const cover = items[0];
    return `<button class="album-card" data-album="${escapeHtml(name)}"><span class="album-cover ${cover ? '' : 'album-cover-empty'}">${cover ? `<img src="${photo(cover, 900)}" alt="" loading="lazy" />` : icon('albums', 38)}</span><span class="album-name">${escapeHtml(name)}</span><span class="album-count">${items.length} sample ${items.length === 1 ? 'item' : 'items'}</span></button>`;
  }).join('')}</div>`;
}

function searchResults() {
  if (!state.query) return `<div class="suggestions"><h2>Start with a place or moment</h2><div>${['Kyoto', 'Mountains', 'Coast', '2026'].map(term => `<button data-suggest="${term}">${term}</button>`).join('')}</div></div>`;
  const items = findMedia(state.query);
  return `<section class="library-section"><div class="section-heading"><h2>Results</h2><span>${items.length} found</span></div>${mediaGrid(items)}</section>`;
}

function searchPage() {
  return `<header class="page-heading"><div><span class="eyebrow">SAMPLE SEARCH</span><h1>Search</h1><p>Find a place, date, or album in this preview.</p></div></header><label class="search-large">${icon('search', 23)}<input id="main-search" type="search" placeholder="Try Kyoto, mountains, or 2026" value="${escapeHtml(state.query)}" aria-label="Search sample media" autocomplete="off" /></label><p class="index-note">Only these sample photos are searchable. Your private library is not connected.</p><div id="search-results" aria-live="polite">${searchResults()}</div>`;
}

function favorites() {
  const items = media.filter(item => state.favorites.has(item.id));
  return `<header class="page-heading"><div><span class="eyebrow">SAMPLE COLLECTION</span><h1>Favorites</h1><p>${items.length ? `${items.length} saved in this session` : 'Keep the moments you want to find again.'} · Resets on reload</p></div></header>${items.length ? `<section class="library-section">${mediaGrid(items)}</section>` : empty('No favorites yet', 'Open a sample photo and tap the heart to save it for this session.', 'Browse photos')}`;
}

function viewer() {
  const item = media.find(m => m.id === state.selected);
  if (!item) return '';
  const items = viewerItems();
  const index = items.findIndex(m => m.id === item.id);
  const chrome = state.viewerChrome;
  return `<div class="viewer ${chrome ? '' : 'chrome-hidden'}" role="dialog" aria-modal="true" aria-label="${escapeHtml(item.title)}" id="viewer">
    <div class="viewer-top" ${chrome ? '' : 'inert aria-hidden="true"'}><button class="viewer-icon" data-close aria-label="Back to photos">${icon('back', 23)}</button><span class="viewer-counter">${index + 1} of ${items.length}</span><button class="viewer-icon" data-info aria-label="Photo information" aria-pressed="${state.viewerInfo}">${icon('info', 21)}</button></div>
    <div class="viewer-stage"><button class="viewer-step previous" data-step="-1" aria-label="Previous photo" ${!chrome ? 'inert aria-hidden="true"' : ''} ${items.length < 2 ? 'disabled' : ''}>${icon('back', 25)}</button><button class="viewer-image" data-chrome aria-label="${chrome ? 'Hide' : 'Show'} photo controls"><img src="${photo(item, 2000)}" alt="Sample ${item.type === 'video' ? 'video poster' : 'photograph'}: ${escapeHtml(item.title)}" /></button><button class="viewer-step next" data-step="1" aria-label="Next photo" ${!chrome ? 'inert aria-hidden="true"' : ''} ${items.length < 2 ? 'disabled' : ''}>${icon('next', 25)}</button></div>
    <div class="viewer-bottom" ${chrome ? '' : 'inert aria-hidden="true"'}><div class="viewer-details"><div><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.place)} · ${formatDate(item.date)}</span></div><button class="viewer-icon viewer-favorite ${state.favorites.has(item.id) ? 'is-favorite' : ''}" data-favorite="${item.id}" aria-label="${state.favorites.has(item.id) ? 'Remove from favorites' : 'Add to favorites'}" aria-pressed="${state.favorites.has(item.id)}">${icon('heart', 22)}</button></div><div class="viewer-filmstrip" aria-label="Photo thumbnails">${items.map(m => `<button data-jump="${m.id}" aria-label="View ${escapeHtml(m.title)}" ${m.id === item.id ? 'aria-current="true"' : ''}><img src="${photo(m, 150)}" alt="" /></button>`).join('')}</div></div>
    ${state.viewerInfo && chrome ? `<aside class="viewer-info" aria-label="Photo details"><h2>Details</h2><dl><dt>Name</dt><dd>${escapeHtml(item.title)}</dd><dt>Date</dt><dd>${formatDate(item.date)}</dd><dt>Location</dt><dd>${escapeHtml(item.place)}</dd><dt>Type</dt><dd>${item.type === 'video' ? 'Sample video poster' : 'Sample photo'}</dd></dl><p>Preview only · original not connected</p></aside>` : ''}
  </div>`;
}

function render() {
  document.body.classList.toggle('viewer-open', Boolean(state.selected));
  app.innerHTML = `<div class="layout"><aside class="sidebar"><div class="brand"><span class="brand-mark">N</span><span>Nexo <small>Gallery</small></span></div><nav aria-label="Main navigation">${navButton('all', 'Photos', 'photos')}${navButton('albums', 'Albums', 'albums')}${navButton('favorites', 'Favorites', 'heart')}${navButton('search', 'Search', 'search')}</nav><div class="sidebar-bottom"><span class="demo-dot"></span>Sample library · no personal media</div></aside><div class="main-column"><header class="topbar"><div class="topbar-brand">Nexo <span>Gallery</span></div><div class="topbar-actions"><button class="theme-control" data-theme aria-label="${state.theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}" title="Toggle theme">${icon(state.theme === 'dark' ? 'sun' : 'moon', 19)}</button><span class="preview-label">Preview</span></div></header><main id="main">${state.page === 'all' ? library() : state.page === 'albums' ? albums() : state.page === 'favorites' ? favorites() : searchPage()}</main></div><nav class="mobile-nav" aria-label="Mobile navigation">${navButton('all', 'Photos', 'photos')}${navButton('albums', 'Albums', 'albums')}${navButton('favorites', 'Favorites', 'heart')}${navButton('search', 'Search', 'search')}</nav></div>${state.selected ? viewer() : ''}`;
  if (state.selected) {
    document.querySelector('.layout').inert = true;
    document.querySelector('[data-close]')?.focus();
    const activeThumb = document.querySelector('.viewer-filmstrip [aria-current]');
    activeThumb?.scrollIntoView({ inline: 'center', block: 'nearest' });
  }
}

function focusHeading() {
  const heading = document.querySelector('#main h1');
  if (heading) { heading.tabIndex = -1; heading.focus(); }
}
function navigate(page) {
  state.page = page; state.album = null; state.query = ''; state.type = 'all'; state.selected = null;
  render(); window.scrollTo(0, 0);
  if (page === 'search') document.querySelector('#main-search')?.focus(); else focusHeading();
}
function closeViewer() {
  const opener = state.viewerOpener;
  state.selected = null; state.viewerOpener = null; state.viewerInfo = false; state.viewerChrome = true;
  render();
  (document.querySelector(`[data-open="${opener}"]`) || document.querySelector('.nav-item.active'))?.focus();
}
function moveViewer(step) {
  const items = viewerItems();
  const index = items.findIndex(item => item.id === state.selected);
  if (index < 0 || items.length < 2) return;
  const focusStep = document.activeElement?.dataset.step;
  state.selected = items[(index + step + items.length) % items.length].id;
  state.viewerInfo = false; render();
  (focusStep ? document.querySelector(`[data-step="${focusStep}"]`) : document.querySelector('.viewer-image'))?.focus();
}

app.addEventListener('click', event => {
  const target = event.target.closest('button');
  if (!target) return;
  if (target.dataset.page) navigate(target.dataset.page);
  else if (target.dataset.open) { state.selected = target.dataset.open; state.viewerOpener = target.dataset.open; state.viewerChrome = true; state.viewerInfo = false; render(); }
  else if (target.dataset.close !== undefined) closeViewer();
  else if (target.dataset.step) moveViewer(Number(target.dataset.step));
  else if (target.dataset.jump) { state.selected = target.dataset.jump; state.viewerInfo = false; render(); document.querySelector(`[data-jump="${state.selected}"]`)?.focus(); }
  else if (target.dataset.chrome !== undefined) { state.viewerChrome = !state.viewerChrome; if (!state.viewerChrome) state.viewerInfo = false; render(); document.querySelector('.viewer-image')?.focus(); }
  else if (target.dataset.info !== undefined) { state.viewerInfo = !state.viewerInfo; render(); document.querySelector('[data-info]')?.focus(); }
  else if (target.dataset.favorite) {
    const id = target.dataset.favorite; const wasFavorite = state.favorites.has(id);
    wasFavorite ? state.favorites.delete(id) : state.favorites.add(id);
    if (state.page === 'favorites' && wasFavorite) closeViewer();
    else { render(); document.querySelector('[data-favorite]')?.focus(); }
  }
  else if (target.dataset.type) { state.type = target.dataset.type; render(); document.querySelector(`[data-type="${state.type}"]`)?.focus(); }
  else if (target.dataset.group) { state.grouping = target.dataset.group; render(); document.querySelector(`[data-group="${state.grouping}"]`)?.focus(); }
  else if (target.dataset.album) { state.album = target.dataset.album; state.page = 'all'; state.type = 'all'; render(); focusHeading(); }
  else if (target.dataset.suggest) { state.query = target.dataset.suggest; render(); document.querySelector('#main-search')?.focus(); }
  else if (target.dataset.clear !== undefined) { state.query = ''; state.type = 'all'; render(); (document.querySelector('#main-search') || document.querySelector('[data-type="all"]'))?.focus(); }
  else if (target.dataset.theme !== undefined) { state.theme = state.theme === 'dark' ? 'light' : 'dark'; document.documentElement.dataset.theme = state.theme; try { localStorage.setItem('nexo-gallery-theme', state.theme); } catch {} render(); document.querySelector('[data-theme]')?.focus(); }
});

app.addEventListener('input', event => {
  if (event.target.id !== 'main-search') return;
  state.query = event.target.value;
  document.querySelector('#search-results').innerHTML = searchResults();
});

document.addEventListener('keydown', event => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k' && !state.selected) { event.preventDefault(); if (state.page === 'search') document.querySelector('#main-search')?.focus(); else navigate('search'); }
  if (!state.selected) return;
  if (event.key === 'Escape') { if (state.viewerInfo) { state.viewerInfo = false; render(); document.querySelector('[data-info]')?.focus(); } else closeViewer(); }
  if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); moveViewer(event.key === 'ArrowRight' ? 1 : -1); }
  if (event.key === 'Tab') {
    const controls = [...document.querySelectorAll('#viewer button:not(:disabled)')].filter(button => !button.closest('[inert]') && button.getClientRects().length);
    const first = controls[0], last = controls.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
});

let touchStart = null;
app.addEventListener('touchstart', event => {
  if (!event.target.closest('.viewer-image')) return;
  touchStart = { x: event.changedTouches[0].clientX, y: event.changedTouches[0].clientY };
}, { passive: true });
app.addEventListener('touchend', event => {
  if (!touchStart || !state.selected) return;
  const dx = event.changedTouches[0].clientX - touchStart.x;
  const dy = event.changedTouches[0].clientY - touchStart.y;
  touchStart = null;
  if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.2) { event.preventDefault(); moveViewer(dx < 0 ? 1 : -1); }
}, { passive: false });

render();
