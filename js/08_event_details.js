// 8. EVENT DETAILS + COUNTDOWN
// ------------------------------------------------------------
function showDetails(id) {
  const event = findEvent(id);
  if (!event) return;

  selectedEventId = Number(id);
  saveSession('selectedEventId', selectedEventId);

  const open = isBookable(event);
  const bookButton = currentUser.role === 'student' && availableSeats(event) > 0 && open
    ? `<button class="primary-button" data-book="${event.id}">Apply / Book Event</button>`
    : '';

  window.scrollTo(0, 0);
  app.innerHTML = `
    <button class="secondary-button" data-page="events">← Back to events</button>
    <section class="details-card">
      <div class="details-cover" style="background-image:linear-gradient(90deg,rgba(15,22,54,.84),rgba(15,22,54,.25)),url('${event.image}')">
        <div>
          <p class="eyebrow">${escapeText(event.category)}</p>
          <h1>${escapeText(event.title)}</h1>
        </div>
      </div>

      <div class="details-content">
        <p>${escapeText(event.description)}</p>
        ${event.status === 'cancelled' ? '<p class="error">Event cancelled: ' + escapeText(event.cancelReason) + '</p>' : ''}
        <div class="countdown" id="countdown">Loading countdown...</div>

        <div class="detail-list">
          <div><b>Date</b><br>${formatDate(event.date)}</div>
          <div><b>Time</b><br>${event.time}</div>
          <div><b>Venue</b><br>${escapeText(event.venue)}</div>
          <div><b>Organizer</b><br>${escapeText(event.organizer)}</div>
          <div><b>Total Seats</b><br>${event.seats}</div>
          <div><b>Available</b><br>${availableSeats(event)}</div>
          <div><b>Entry Fee</b><br>${event.price === 0 ? 'Free' : '₹' + event.price}</div>
          <div><b>Status</b><br>${!open ? 'Registration Closed' : (availableSeats(event) > 0 ? 'Registration Open' : 'Fully Booked')}</div>
        </div>

        ${currentUser.role === 'student'
          ? (availableSeats(event) > 0 ? bookButton : '<p class="error">This event is fully booked.</p>')
          : '<p class="section-subtitle">Faculty accounts can create and manage events.</p>'}
        <section class="event-guide"><h3>Before you go</h3><p>General admission · Up to 4 passes per booking · Valid campus ID required</p><p>Bring your booking reference. All guests on a booking must enter together. You can cancel before the event starts, unless your booking has already checked in.</p><p>Paid events use a simulated checkout. No money is collected.</p><button id="detailSave" class="secondary-button" aria-pressed="${savedIds().includes(event.id)}">${savedIds().includes(event.id) ? '♥ Saved' : '♡ Save'}</button><button class="secondary-button" data-page="help">Booking help</button></section>
      </div>
    </section>`;

  startCountdown(event);
  document.getElementById('detailSave').addEventListener('click', function (click) { toggleSaved(event.id, click.target); });
}

function startCountdown(event) {
  clearInterval(countdownTimer);

  function updateCountdown() {
    const box = document.getElementById('countdown');
    if (!box) return;

    const eventTime = new Date(event.date + 'T' + event.time).getTime();
    const now = new Date().getTime();
    const difference = eventTime - now;

    if (difference <= 0) {
      box.textContent = 'This event has started or finished.';
      return;
    }

    const days = Math.floor(difference / 86400000);
    const hours = Math.floor((difference / 3600000) % 24);
    const minutes = Math.floor((difference / 60000) % 60);
    const seconds = Math.floor((difference / 1000) % 60);

    box.textContent = `Starts in: ${days} days ${hours} hours ${minutes} minutes ${seconds} seconds`;
  }

  updateCountdown();
  countdownTimer = setInterval(updateCountdown, 1000);
}

// ------------------------------------------------------------
