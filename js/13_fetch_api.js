// Fetch/async-await is used by api() in 01_storage.js.
// Organizer cards use actual event data rather than random external identities.
function loadOrganizerProfiles() {
  const list = document.getElementById('organizerList');
  if (!list) return;
  const organizers = [];
  getEvents().forEach(function (event) {
    if (!organizers.includes(event.organizer)) organizers.push(event.organizer);
  });
  list.innerHTML = organizers.map(function (name) { return '<article class="empty-card"><p class="eyebrow">CAMPUS COMMUNITY</p><h3>' + escapeText(name) + '</h3><p>Bringing people and ideas together.</p></article>'; }).join('');
}
