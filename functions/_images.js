/**
 * Stock image search, icon resolution, and placeholder generation.
 * Searches Pexels → Pixabay for stock photos; falls back to SVG placeholder.
 */

const PEXELS_BASE = 'https://api.pexels.com/v1/search';
const PIXABAY_BASE = 'https://pixabay.com/api/';

function sanitizeQuery(query) {
  return String(query || '')
    .replace(/[^\w\s\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120);
}

async function searchPexels(env, query) {
  const key = env?.PEXELS_API_KEY;
  if (!key) return null;
  const q = sanitizeQuery(query);
  if (!q) return null;
  try {
    const url = `${PEXELS_BASE}?query=${encodeURIComponent(q)}&per_page=5&orientation=landscape`;
    const res = await fetch(url, { headers: { Authorization: key } });
    if (!res.ok) return null;
    const data = await res.json();
    const photos = data?.photos;
    if (!Array.isArray(photos) || !photos.length) return null;
    const photo = photos[Math.floor(Math.random() * photos.length)];
    return photo?.src?.medium || photo?.src?.large || photo?.src?.original || null;
  } catch {
    return null;
  }
}

async function searchPixabay(env, query) {
  const key = env?.PIXABAY_API_KEY;
  if (!key) return null;
  const q = sanitizeQuery(query);
  if (!q) return null;
  try {
    const url = `${PIXABAY_BASE}?key=${encodeURIComponent(key)}&q=${encodeURIComponent(q)}&per_page=5&orientation=horizontal&safesearch=true`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const hits = data?.hits;
    if (!Array.isArray(hits) || !hits.length) return null;
    const hit = hits[Math.floor(Math.random() * hits.length)];
    return hit?.webformatURL || hit?.largeImageURL || null;
  } catch {
    return null;
  }
}

export async function searchStockImage(env, query) {
  return (await searchPexels(env, query)) || (await searchPixabay(env, query)) || null;
}

/* ── icon SVG generator ─────────────────────────────────────────────── */

const ICON_SVG_MAP = {
  people: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  person: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  user: 'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2 M12 3a4 4 0 100 8 4 4 0 000-8z',
  group: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M9 3a4 4 0 100 8 4 4 0 000-8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75',
  chart: 'M18 20V10M12 20V4M6 20v-6',
  bar_chart: 'M18 20V10M12 20V4M6 20v-6',
  graph: 'M18 20V10M12 20V4M6 20v-6',
  'chart-bar': 'M18 20V10M12 20V4M6 20v-6',
  analytics: 'M18 20V10M12 20V4M6 20v-6',
  stats: 'M18 20V10M12 20V4M6 20v-6',
  data: 'M18 20V10M12 20V4M6 20v-6',
  growth: 'M23 6L13.5 15.5 8.5 10.5 1 18M17 8h-6m6-6v6',
  trending: 'M23 6L13.5 15.5 8.5 10.5 1 18M17 8h-6m6-6v6',
  'trending-up': 'M23 6L13.5 15.5 8.5 10.5 1 18M17 8h-6m6-6v6',
  arrow_up: 'M12 19V5M5 12l7-7 7 7',
  target: 'M22 12h-4M6 12H2M12 2v4M12 18v4 M12 16a4 4 0 100-8 4 4 0 000 8z',
  goal: 'M22 12h-4M6 12H2M12 2v4M12 18v4 M12 16a4 4 0 100-8 4 4 0 000 8z',
  success: 'M22 11.08V12a10 10 0 11-5.93-9.14 M22 4L12 14.01l-3-3',
  check: 'M20 6L9 17l-5-5',
  checkmark: 'M20 6L9 17l-5-5',
  'circle-check': 'M22 11.08V12a10 10 0 11-5.93-9.14 M22 4L12 14.01l-3-3',
  gear: 'M14.7 6.3a1 1 0 000-1.4l-1.4-1.4a1 1 0 00-1.4 0l-1.2 1.2a8 8 0 01-2.6-.6l-.2-1.6a1 1 0 00-1-1H5a1 1 0 00-1 1l-.2 1.6a8 8 0 01-2.6.6L0 3.4a1 1 0 00-1.4 0l-1.4 1.4a1 1 0 000 1.4l1.2 1.2a8 8 0 01-.6 2.6L3 10a1 1 0 00-1 1v2a1 1 0 001 1l1.6.2a8 8 0 01.6 2.6L4 18a1 1 0 000 1.4l1.4 1.4a1 1 0 001.4 0l1.2-1.2a8 8 0 012.6.6L9 21.9a1 1 0 001 1h2a1 1 0 001-1l.2-1.6a8 8 0 012.6-.6l1.2 1.2a1 1 0 001.4 0l1.4-1.4a1 1 0 000-1.4l-1.2-1.2a8 8 0 01.6-2.6L21 14a1 1 0 001-1v-2a1 1 0 00-1-1l-1.6-.2a8 8 0 01-.6-2.6L20 6a1 1 0 000-1.4l-1.4-1.4a1 1 0 00-1.4 0l-1.2 1.2a8 8 0 01-2.6-.6L14.7 6.3z',
  settings: 'M14.7 6.3a1 1 0 000-1.4l-1.4-1.4a1 1 0 00-1.4 0l-1.2 1.2a8 8 0 01-2.6-.6l-.2-1.6a1 1 0 00-1-1H5a1 1 0 00-1 1l-.2 1.6a8 8 0 01-2.6.6L0 3.4a1 1 0 00-1.4 0l-1.4 1.4a1 1 0 000 1.4l1.2 1.2a8 8 0 01-.6 2.6L3 10a1 1 0 00-1 1v2a1 1 0 001 1l1.6.2a8 8 0 01.6 2.6L4 18a1 1 0 000 1.4l1.4 1.4a1 1 0 001.4 0l1.2-1.2a8 8 0 012.6.6L9 21.9a1 1 0 001 1h2a1 1 0 001-1l.2-1.6a8 8 0 012.6-.6l1.2 1.2a1 1 0 001.4 0l1.4-1.4a1 1 0 000-1.4l-1.2-1.2a8 8 0 01.6-2.6L21 14a1 1 0 001-1v-2a1 1 0 00-1-1l-1.6-.2a8 8 0 01-.6-2.6L20 6a1 1 0 000-1.4l-1.4-1.4a1 1 0 00-1.4 0l-1.2 1.2a8 8 0 01-2.6-.6L14.7 6.3z',
  lightbulb: 'M12 2a7 7 0 00-7 7c0 2.4 1.2 4.5 3 5.7V17a2 2 0 004 0v-2.3c1.8-1.2 3-3.3 3-5.7a7 7 0 00-7-7zM9 21h6M10 18h4',
  idea: 'M12 2a7 7 0 00-7 7c0 2.4 1.2 4.5 3 5.7V17a2 2 0 004 0v-2.3c1.8-1.2 3-3.3 3-5.7a7 7 0 00-7-7zM9 21h6M10 18h4',
  innovation: 'M12 2a7 7 0 00-7 7c0 2.4 1.2 4.5 3 5.7V17a2 2 0 004 0v-2.3c1.8-1.2 3-3.3 3-5.7a7 7 0 00-7-7zM9 21h6M10 18h4',
  star: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  favorite: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM8 11l2 2 4-4',
  security: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM8 11l2 2 4-4',
  lock: 'M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2zM7 11V7a5 5 0 0110 0v4',
  globe: 'M12 2a10 10 0 100 20 10 10 0 000-20zM2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z',
  world: 'M12 2a10 10 0 100 20 10 10 0 000-20zM2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z',
  global: 'M12 2a10 10 0 100 20 10 10 0 000-20zM2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z',
  heart: 'M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z',
  like: 'M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14zM7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3',
  clock: 'M12 22a10 10 0 100-20 10 10 0 000 20zM12 6v6l4 2',
  time: 'M12 22a10 10 0 100-20 10 10 0 000 20zM12 6v6l4 2',
  timeline: 'M12 22a10 10 0 100-20 10 10 0 000 20zM12 6v6l4 2',
  calendar: 'M19 4H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2zM16 2v4M8 2v4M3 10h18',
  date: 'M19 4H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2zM16 2v4M8 2v4M3 10h18',
  document: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8',
  file: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8',
  paper: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8',
  search: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
  find: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
  zoom: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
  mail: 'M4 4h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2zM22 6l-10 7L2 6',
  email: 'M4 4h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2zM22 6l-10 7L2 6',
  message: 'M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z',
  chat: 'M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z',
  phone: 'M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z',
  call: 'M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z',
  map: 'M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4zM8 2v16M16 6v16',
  pin: 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1118 0zM12 13a3 3 0 100-6 3 3 0 000 6z',
  location: 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1118 0zM12 13a3 3 0 100-6 3 3 0 000 6z',
  bookmark: 'M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2v16z',
  flag: 'M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1v12zM4 22v-7',
  award: 'M12 15a7 7 0 100-14 7 7 0 000 14zM8.21 13.89L7 23l5-3 5 3-1.21-9.12',
  trophy: 'M6 9H4.5A2.5 2.5 0 010 6.5v-1A2.5 2.5 0 012.5 3H6M18 9h1.5a2.5 2.5 0 002.5-2.5v-1A2.5 2.5 0 0021.5 3H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22M18 2H6v7a6 6 0 0012 0V2z',
  rocket: 'M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 00-2.91-.09zM12 15l-3-3a22 22 0 012-3.95A12.88 12.88 0 0122 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 01-4 2zM9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5',
  bulb: 'M10 17.66V20h4 M10 10a2 2 0 104 0M5.636 5.636a7 7 0 000 9.9 6.1 6.1 0 002.1 1.45',
  building: 'M3 21h18M3 7v14h18V7M10 11h4M10 15h4M10 7h.01M14 7h.01M10 3h.01M14 3h.01',
  company: 'M3 21h18M3 7v14h18V7M10 11h4M10 15h4M10 7h.01M14 7h.01M10 3h.01M14 3h.01',
  office: 'M3 21h18M3 7v14h18V7M10 11h4M10 15h4M10 7h.01M14 7h.01M10 3h.01M14 3h.01',
  home: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2zM9 22V12h6v10',
  house: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2zM9 22V12h6v10',
  dollar: 'M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6',
  money: 'M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6',
  bank: 'M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6',
  finance: 'M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6',
  shopping: 'M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6 M6 23a1 1 0 100 2 1 1 0 000-2z M18 23a1 1 0 100 2 1 1 0 000-2z',
  cart: 'M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6 M6 23a1 1 0 100 2 1 1 0 000-2z M18 23a1 1 0 100 2 1 1 0 000-2z',
  truck: 'M1 3h15v13H1zM16 8h4l3 3v5h-2.5 M5.5 18.5a2.5 2.5 0 100 5 2.5 2.5 0 000-5zM18.5 18.5a2.5 2.5 0 100 5 2.5 2.5 0 000-5z',
  image: 'M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zM8.5 10a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM21 15l-5-5L5 21',
  picture: 'M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zM8.5 10a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM21 15l-5-5L5 21',
  camera: 'M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2v11zM16 13a4 4 0 100-8 4 4 0 000 8z',
  video: 'M23 7l-7 5 7 5V7zM14 5H3a2 2 0 00-2 2v10a2 2 0 002 2h11a2 2 0 002-2V7a2 2 0 00-2-2z',
  music: 'M9 18V5l12-2v13M6 21a3 3 0 100-6 3 3 0 000 6zM19 17a3 3 0 100-6 3 3 0 000 6z',
  microphone: 'M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3zM19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8',
  mic: 'M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3zM19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8',
  cloud: 'M18 10h-1.26A8 8 0 102 10h-.74A4 4 0 100 18h16a4 4 0 004-4 4 4 0 00-2-4z',
  'cloud-computing': 'M18 10h-1.26A8 8 0 102 10h-.74A4 4 0 100 18h16a4 4 0 004-4 4 4 0 00-2-4z',
  server: 'M20 2H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V4a2 2 0 00-2-2zM8 2v20M8 6h.01M8 10h.01M8 14h.01M8 18h.01',
  laptop: 'M20 18H4a2 2 0 01-2-2V6a2 2 0 012-2h16a2 2 0 012 2v10a2 2 0 01-2 2zM2 20h20',
  computer: 'M20 18H4a2 2 0 01-2-2V6a2 2 0 012-2h16a2 2 0 012 2v10a2 2 0 01-2 2zM2 20h20',
  wifi: 'M1 8.16a15 15 0 0122 0M6.5 14.32a7 7 0 0111 0M12 20h.01',
  bluetooth: 'M6.5 6.5l11 11L12 23V1l5.5 5.5-11 11',
  battery: 'M23 13v-2M1 6h18v12H1zM19 10h4v4h-4z',
  'battery-charging': 'M23 13v-2M1 6h18v12H1zM19 10h4v4h-4zM12 9l-4 6h3l-1 4 4-7h-3l1-3z',
  leaf: 'M17 8a9 9 0 01-9 9M17 8a9 9 0 00-9-9M17 8h0M1 23s4-4 7-9 M12 1l8 8',
  plant: 'M17 8a9 9 0 01-9 9M17 8a9 9 0 00-9-9M17 8h0M1 23s4-4 7-9 M12 1l8 8',
  eco: 'M17 8a9 9 0 01-9 9M17 8a9 9 0 00-9-9M17 8h0M1 23s4-4 7-9 M12 1l8 8',
  'environment': 'M17 8a9 9 0 01-9 9M17 8a9 9 0 00-9-9M17 8h0M1 23s4-4 7-9 M12 1l8 8',
  green: 'M17 8a9 9 0 01-9 9M17 8a9 9 0 00-9-9M17 8h0M1 23s4-4 7-9 M12 1l8 8',
  recycle: 'M6.5 6.5l3.5-2 1 3.86M13 22l-3.5-2M10.5 11.5l5 3M21 15l-3.5 6M2 18l1.5-9',
  code: 'M16 18l6-6-6-6M8 6l-6 6 6 6',
  'code-bracket': 'M16 18l6-6-6-6M8 6l-6 6 6 6',
  terminal: 'M4 17l6-6-6-6M12 19h8',
  api: 'M16 18l6-6-6-6M8 6l-6 6 6 6M12 19h8',
  database: 'M8 6a4 4 0 118 0M8 6a4 4 0 108 0M8 6v8a4 4 0 008 0V6M4 6v8a4 4 0 008 0M22 6v8a4 4 0 01-8 0M8 14a4 4 0 108 0',
  book: 'M4 19.5A2.5 2.5 0 016.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z',
  education: 'M22 10.5l-9-5-9 5 9 5 9-5zM4 10.5v6c0 3 4 5.5 9 5.5s9-2.5 9-5.5M12 15.5v6',
  school: 'M22 10.5l-9-5-9 5 9 5 9-5zM4 10.5v6c0 3 4 5.5 9 5.5s9-2.5 9-5.5M12 15.5v6',
};

function normalizeIconQuery(name) {
  return String(name || '').toLowerCase().replace(/[_\-\s]+/g, ' ').trim();
}

function findIconPath(query) {
  const name = normalizeIconQuery(query);
  if (ICON_SVG_MAP[name]) return ICON_SVG_MAP[name];
  const words = name.split(/\s+/);
  for (const word of words) {
    if (ICON_SVG_MAP[word]) return ICON_SVG_MAP[word];
  }
  for (const [key, path] of Object.entries(ICON_SVG_MAP)) {
    if (name.includes(key) || key.includes(name)) return path;
  }
  return null;
}

export function iconSvgDataUri(pal, query) {
  const accent = (pal && pal.accent) || '#1E4CD9';
  const bg = (pal && pal.soft) || '#F5F3FF';
  const path = findIconPath(query);
  if (path) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="${accent}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="11" fill="${bg}" stroke="${accent}" stroke-width="1"/><g transform="translate(1,1) scale(0.85)"><path d="${path}"/></g></svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }
  const label = escapeXml(String(query || '?').slice(0, 3).toUpperCase());
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><circle cx="60" cy="60" r="48" fill="${bg}" stroke="${accent}" stroke-width="2"/><text x="60" y="68" font-family="Arial,Helvetica,sans-serif" font-size="28" font-weight="bold" fill="${accent}" text-anchor="middle">${label}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function placeholderImage(pal, prompt, isIcon) {
  const accent = (pal && pal.accent) || '#1E4CD9';
  if (isIcon) return iconSvgDataUri(pal, prompt);
  const label = escapeXml(String(prompt || 'image').slice(0, 32));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${accent}44"/><stop offset="100%" stop-color="${accent}99"/></linearGradient></defs><rect width="800" height="600" fill="url(#g)"/><text x="400" y="300" font-family="Arial,Helvetica,sans-serif" font-size="30" fill="#FFFFFF" text-anchor="middle" dominant-baseline="middle">${label}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Process image elements in a slide's UI tree.
 * For each element with content_prompt but no data, fetch a stock image
 * or set a placeholder. Icons get icon SVGs.
 */
export async function hydrateImages(env, ui, pal, template) {
  if (!ui?.components) return;

  if (template) {
    _rewriteDecorativeImagePaths(ui.components, template);
  }

  const contentTasks = [];
  const iconTasks = [];
  const walk = (elems) => {
    for (const el of elems || []) {
      if (el.type === 'image' && !el.data) {
        const prompt = el.content_prompt || _deriveImagePrompt(el);
        if (prompt) {
          el.content_prompt = prompt;
          if (el.is_icon) {
            iconTasks.push(el);
          } else {
            contentTasks.push(el);
          }
        }
      }
      if (el.type === 'container' && el.child) walk([el.child]);
      if (el.type === 'flex' || el.type === 'grid' || el.type === 'group') {
        walk(el.children || []);
      }
    }
  };
  for (const comp of ui.components) walk(comp.elements || []);

  // Icons: resolve immediately (no network call needed)
  for (const el of iconTasks) {
    el.data = iconSvgDataUri(pal, el.content_prompt);
  }

  // Stock photos: fetch in parallel batches
  const CONCURRENCY = 5;
  for (let i = 0; i < contentTasks.length; i += CONCURRENCY) {
    const batch = contentTasks.slice(i, i + CONCURRENCY);
    await Promise.allSettled(
      batch.map(async (el) => {
        const url = await searchStockImage(env, el.content_prompt);
        el.data = url || placeholderImage(pal, el.content_prompt, false);
      }),
    );
  }
}

export function buildSlideAssets(ui) {
  const assets = [];
  const walk = (elems) => {
    for (const el of elems || []) {
      if (el.type === 'image' && el.content_prompt) {
        assets.push({ prompt: el.content_prompt, data: el.data || null });
      }
      if (el.type === 'container' && el.child) walk([el.child]);
      if (el.type === 'flex' || el.type === 'grid' || el.type === 'group') {
        walk(el.children || []);
      }
    }
  };
  if (ui?.components) {
    for (const comp of ui.components) walk(comp.elements || []);
  }
  return assets;
}

function _deriveImagePrompt(el) {
  if (!el || el.decorative === true) return null;
  if (el.name) {
    return String(el.name)
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .replace(/\s+/g, ' ')
      .trim();
  }
  return null;
}

function _rewriteDecorativeImagePaths(components, template) {
  if (!template) return;
  const walk = (elems) => {
    for (const el of elems || []) {
      if (el.type === 'image' && el.data && typeof el.data === 'string') {
        const data = el.data;
        if (data.startsWith('http://') || data.startsWith('https://') || data.startsWith('data:')) continue;
        if (data.includes('/static/images/replaceable') || data.includes('/static/icons/placeholder')) {
          el.data = null;
          continue;
        }
        if (data.includes('/static/icons/')) {
          const idx = data.indexOf('static/icons/');
          if (idx >= 0) {
            el.data = `/arena/templates/${template}/${data.slice(idx)}`;
          }
          continue;
        }
        const idx = data.indexOf('static/');
        if (idx >= 0) {
          el.data = `/arena/templates/${template}/${data.slice(idx)}`;
        }
      }
      if (el.type === 'container' && el.child) walk([el.child]);
      if (el.type === 'flex' || el.type === 'grid' || el.type === 'group') {
        walk(el.children || []);
      }
    }
  };
  for (const comp of components) walk(comp.elements || []);
}
