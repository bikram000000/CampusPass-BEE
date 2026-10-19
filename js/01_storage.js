// 1. STORAGE - localStorage, sessionStorage and JSON
// ------------------------------------------------------------
function getData(key, defaultValue) {
  try { const data = localStorage.getItem(key); return data ? JSON.parse(data) : defaultValue; }
  catch (error) { return defaultValue; }
}

function saveData(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getSession(key, defaultValue) {
  try { const data = sessionStorage.getItem(key); return data ? JSON.parse(data) : defaultValue; }
  catch (error) { return defaultValue; }
}

function saveSession(key, value) {
  sessionStorage.setItem(key, JSON.stringify(value));
}

function removeSession(key) {
  sessionStorage.removeItem(key);
}

// API results are kept in memory for the DOM rendering functions.
let eventCache = [];
let ticketCache = [];
function getEvents() { return eventCache; }
function getTickets() { return ticketCache; }
async function api(path, method = 'GET', body) {
  const options = { method: method, credentials: 'same-origin', headers: { 'Content-Type': 'application/json' } };
  if (body) options.body = JSON.stringify(body);
  const response = await fetch('/api' + path, options);
  const data = await response.json();
  if (!response.ok) {
    if (response.status === 401 && currentUser) { currentUser = null; eventCache = []; ticketCache = []; showLogin(); }
    throw new Error(data.message || 'Request failed.');
  }
  return data;
}
async function refreshData() {
  eventCache = await api('/events');
  ticketCache = await api('/tickets');
}
