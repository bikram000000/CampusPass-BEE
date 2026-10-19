// Discovery helpers: arrays, objects, DOM and localStorage (lectures 1–24).
function isBookable(event) { return event.status !== 'cancelled' && new Date(event.date + 'T' + event.time) > new Date(); }
function money(value) { return '₹' + Number(value).toLocaleString('en-IN', { maximumFractionDigits: 2 }); }
function savedIds() { return getData('campusSaved:' + currentUser.email, []); }
function toggleSaved(id, button) {
  let ids = savedIds();
  ids = ids.includes(id) ? ids.filter(item => item !== id) : [...ids, id];
  saveData('campusSaved:' + currentUser.email, ids);
  button.textContent = ids.includes(id) ? '♥ Saved' : '♡ Save';
  button.setAttribute('aria-pressed', String(ids.includes(id)));
  document.querySelectorAll('[data-save-id="' + id + '"]').forEach(function (item) {
    item.textContent = ids.includes(id) ? '♥ Saved' : '♡ Save';
    item.setAttribute('aria-pressed', String(ids.includes(id)));
  });
  showToast(ids.includes(id) ? 'Added to your wishlist.' : 'Removed from your wishlist.');
  if (document.getElementById('savedList')) showSaved();
}
function createEventCard(event) {
  const card = document.createElement('article');
  card.className = 'event-card';
  const remaining = availableSeats(event);
  const label = event.status === 'cancelled' ? 'Cancelled' : !isBookable(event) ? 'Ended' : remaining === 0 ? 'Sold out' : remaining <= 10 ? 'Filling fast' : 'Booking open';
  card.innerHTML = `
    <div class="event-cover" style="background-image:url('${event.image || ''}')">
      <span>${escapeText(event.category)}</span><h3>${escapeText(event.title)}</h3>
    </div>
    <div class="event-body">
      <div class="card-meta"><span class="status ${!isBookable(event) ? 'cancelled' : ''}">${label}</span><span>${event.price === 0 ? 'FREE' : money(event.price) + ' / pass'}</span></div>
      <p><b>${formatDate(event.date)}</b> · ${event.time}</p>
      <p>${escapeText(event.venue)}</p>
      <p class="seats">${remaining} passes left · General admission</p>
      <div class="capacity"><span style="width:${Math.min(100, event.booked / event.seats * 100)}%"></span></div>
      <button class="primary-button" data-details="${event.id}">Explore event →</button>
      <button class="save-button" data-save-id="${event.id}" aria-pressed="${savedIds().includes(event.id)}">${savedIds().includes(event.id) ? '♥ Saved' : '♡ Save'}</button>
    </div>`;
  card.querySelector('.save-button').addEventListener('click', function (click) { toggleSaved(event.id, click.target); });
  return card;
}
function displayEvents(events, container) {
  container.innerHTML = '';
  if (!events.length) { container.innerHTML = '<div class="empty-card"><h3>No events here yet</h3><p>Try a different filter or explore more campus experiences.</p><button class="secondary-button" data-page="events">Explore events</button></div>'; return; }
  events.forEach(event => container.appendChild(createEventCard(event)));
}
function showSaved() {
  app.innerHTML = '<p class="eyebrow">YOUR SHORTLIST</p><h1 class="section-title">Worth making time for.</h1><p class="section-subtitle">Saved on this browser, just for your account. Tap Saved to remove an event.</p><div id="savedList" class="event-grid"></div>';
  displayEvents(getEvents().filter(event => savedIds().includes(event.id)), document.getElementById('savedList'));
}
