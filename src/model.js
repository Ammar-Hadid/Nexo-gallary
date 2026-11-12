import { media } from './data.js';

export function findMedia(query = '', type = 'all', album = null) {
  const words = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return media.filter(item => {
    if (type !== 'all' && item.type !== type) return false;
    if (album && item.album !== album) return false;
    const haystack = `${item.title} ${item.place} ${item.date} ${item.album} ${item.tags} ${item.type}`.toLocaleLowerCase();
    return words.every(word => haystack.includes(word));
  });
}

export function formatDate(date) {
  return new Intl.DateTimeFormat('en', { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(`${date}T12:00:00Z`));
}
