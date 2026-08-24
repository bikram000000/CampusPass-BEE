// 1. STORAGE - localStorage, sessionStorage and JSON
// ------------------------------------------------------------
function getData(key, defaultValue) {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : defaultValue;
}

function saveData(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getSession(key, defaultValue) {
  const data = sessionStorage.getItem(key);
  return data ? JSON.parse(data) : defaultValue;
}

function saveSession(key, value) {
  sessionStorage.setItem(key, JSON.stringify(value));
}

function removeSession(key) {
  sessionStorage.removeItem(key);
}

function getAccounts() { return getData('campusPassAccounts', []); }
function getEvents() { return getData('campusPassEvents', []); }
function getTickets() { return getData('campusPassTickets', []); }
function saveAccounts(accounts) { saveData('campusPassAccounts', accounts); }
function saveEvents(events) { saveData('campusPassEvents', events); }
function saveTickets(tickets) { saveData('campusPassTickets', tickets); }

// ------------------------------------------------------------
