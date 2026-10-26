// Old CA1 passwords and identities must not remain in browser storage.
['campusPassAccounts', 'campusPassUser', 'campusPassEvents', 'campusPassTickets'].forEach(function (key) { localStorage.removeItem(key); });
for (let index = localStorage.length - 1; index >= 0; index--) {
  const key = localStorage.key(index);
  if (key && key.startsWith('campusSaved:')) localStorage.removeItem(key);
}
async function startApp() {
  app.innerHTML = '<div class="empty-card">Opening your campus…</div>';
  try {
    const result = await api('/auth/me');
    currentUser = result.user;
    await refreshData();
    showApp('home');
  } catch (error) { showLogin(); }
}
startApp();
