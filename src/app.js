'use strict';

const nav = document.querySelector('.navigation');
const toggle = document.querySelector('.menu-toggle');
toggle.hidden = false;
nav.classList.add('menu-enabled');
function closeMenu() {
  nav.classList.remove('menu-open');
  toggle.setAttribute('aria-expanded', 'false');
}
toggle.addEventListener('click', () => {
  const open = nav.classList.toggle('menu-open');
  toggle.setAttribute('aria-expanded', String(open));
});
document.querySelectorAll('#nav-links a').forEach(link => link.addEventListener('click', closeMenu));
nav.addEventListener('keydown', event => {
  if (event.key === 'Escape' && nav.classList.contains('menu-open')) {
    closeMenu();
    toggle.focus();
  }
});
document.getElementById('year').textContent = new Date().getFullYear();

const copyButton = document.getElementById('copy-email');
copyButton.hidden = false;
copyButton.addEventListener('click', async () => {
  const message = document.getElementById('copy-message');
  try {
    await navigator.clipboard.writeText('admin@frostbyte.it');
    message.textContent = 'Email address copied.';
  } catch {
    message.textContent = 'Select and copy admin@frostbyte.it, or use the email link above.';
  }
});

document.querySelectorAll('.enquiry-link').forEach(link => {
  const topic = link.dataset.topic;
  const body = `Hi Frostbyte,\n\nI'd like to discuss ${topic.toLowerCase()}.\n\nMy requirements:\n\n`;
  link.href = `mailto:admin@frostbyte.it?subject=${encodeURIComponent(topic + ' enquiry')}&body=${encodeURIComponent(body)}`;
});

const refreshButton = document.getElementById('refresh-status');
const statusMessage = document.getElementById('status-message');
const serverGrid = document.getElementById('server-grid');
const updated = document.getElementById('status-updated');
const endpoint = window.FROSTBYTE_CONFIG?.statusEndpoint;
const MAX_AGE = 5 * 60 * 1000;
let busy = false;
let lastUpdated = null;

function renderServer(server, stale) {
  const card = document.createElement('article');
  card.className = 'server-card';
  const name = document.createElement('h3');
  name.textContent = server.name;
  const game = document.createElement('p');
  game.textContent = server.game || 'Game server';
  const badge = document.createElement('span');
  const status = stale ? 'unknown' : server.status;
  badge.className = 'status-badge';
  badge.dataset.status = status;
  badge.textContent = status === 'online' ? 'Online' : status === 'offline' ? 'Offline' : 'Status unknown';
  card.append(name, badge, game);
  if (!stale && status === 'online' && Number.isInteger(server.players) && server.players >= 0) {
    const players = document.createElement('p');
    const maximum = Number.isInteger(server.maxPlayers) && server.maxPlayers >= server.players ? ` / ${server.maxPlayers}` : '';
    players.textContent = `Players: ${server.players}${maximum}`;
    card.append(players);
  }
  return card;
}

async function refreshServers() {
  if (!endpoint || busy) return;
  busy = true;
  refreshButton.disabled = true;
  statusMessage.textContent = 'Checking server status…';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const url = new URL(endpoint, location.origin);
    if (url.origin !== location.origin) throw new Error('Use a same-origin public feed');
    const response = await fetch(url, { signal: controller.signal, credentials: 'omit', cache: 'no-store', headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error('Status unavailable');
    const data = await response.json();
    const timestamp = Date.parse(data.updatedAt);
    if (!Number.isFinite(timestamp) || timestamp > Date.now() + 60000 || !Array.isArray(data.servers) || !data.servers.every(server => server && typeof server.name === 'string' && server.name.trim() && ['online', 'offline', 'unknown'].includes(server.status) && (server.game === undefined || typeof server.game === 'string'))) throw new Error('Invalid public status feed');
    const stale = Date.now() - timestamp > MAX_AGE;
    serverGrid.replaceChildren(...data.servers.map(server => renderServer(server, stale)));
    lastUpdated = timestamp;
    statusMessage.textContent = stale ? 'The latest status update is out of date. Check the AMP panel for current information.' : data.servers.length ? 'Latest reported server status.' : 'No servers are currently listed in the public overview.';
    updated.textContent = `Last reported: ${new Date(timestamp).toLocaleString()}`;
    updated.hidden = false;
  } catch {
    lastUpdated = null;
    serverGrid.replaceChildren();
    updated.hidden = true;
    statusMessage.textContent = 'Public status is temporarily unavailable. This does not mean your server is offline. Try again or check the AMP panel.';
  } finally {
    clearTimeout(timeout);
    refreshButton.disabled = false;
    busy = false;
  }
}

if (typeof endpoint === 'string' && endpoint.trim()) {
  refreshButton.hidden = false;
  refreshButton.addEventListener('click', refreshServers);
  refreshServers();
  // Stop old snapshots appearing live even while a tab is left open.
  setInterval(() => {
    if (lastUpdated && Date.now() - lastUpdated > MAX_AGE) {
      serverGrid.querySelectorAll('.status-badge').forEach(badge => {
        badge.dataset.status = 'unknown';
        badge.textContent = 'Status unknown';
      });
      serverGrid.querySelectorAll('.server-card p:last-child').forEach(p => {
        if (p.textContent.startsWith('Players:')) p.remove();
      });
      statusMessage.textContent = 'The latest status update is out of date. Check the AMP panel for current information.';
    }
  }, 30000);
}
