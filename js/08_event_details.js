// 8. EVENT DETAILS + COUNTDOWN
// ------------------------------------------------------------
function showDetails(id) {
  const event = findEvent(id);
  if (!event) return;

  selectedEventId = Number(id);
  saveSession('selectedEventId', selectedEventId);

  const bookButton = currentUser.role === 'student' && availableSeats(event) > 0
    ? `<button class="primary-button" data-book="${event.id}">Apply / Book Event</button>`
    : '';

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
        <div class="countdown" id="countdown">Loading countdown...</div>

        <div class="detail-list">
          <div><b>Date</b><br>${formatDate(event.date)}</div>
          <div><b>Time</b><br>${event.time}</div>
          <div><b>Venue</b><br>${escapeText(event.venue)}</div>
          <div><b>Organizer</b><br>${escapeText(event.organizer)}</div>
          <div><b>Total Seats</b><br>${event.seats}</div>
          <div><b>Available</b><br>${availableSeats(event)}</div>
          <div><b>Entry Fee</b><br>${event.price === 0 ? 'Free' : '₹' + event.price}</div>
          <div><b>Status</b><br>${availableSeats(event) > 0 ? 'Registration Open' : 'Fully Booked'}</div>
        </div>

        ${currentUser.role === 'student'
          ? (availableSeats(event) > 0 ? bookButton : '<p class="error">This event is fully booked.</p>')
          : '<p class="section-subtitle">Faculty accounts can create and manage events.</p>'}
      </div>
    </section>`;

  startCountdown(event);
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
