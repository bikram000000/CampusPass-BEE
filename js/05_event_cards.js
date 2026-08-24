// 5. EVENT CARDS + DOM MANIPULATION
// ------------------------------------------------------------
function createEventCard(event) {
  const card = document.createElement('article');
  card.className = 'event-card';
  card.innerHTML = `
    <div class="event-cover" style="background-image:url('${event.image}')">
      <span>${escapeText(event.category)}</span>
      <h3>${escapeText(event.title)}</h3>
    </div>
    <div class="event-body">
      <p><b>${formatDate(event.date)}</b> · ${event.time}</p>
      <p>${escapeText(event.venue)}</p>
      <p>${escapeText(event.organizer)}</p>
      <p class="seats">${availableSeats(event)} of ${event.seats} seats available</p>
      <p><b>${event.price === 0 ? 'Free entry' : '₹' + event.price}</b></p>
      <button class="primary-button" data-details="${event.id}">View Details</button>
    </div>`;
  return card;
}

function displayEvents(events, container) {
  container.innerHTML = '';

  if (events.length === 0) {
    container.innerHTML = '<div class="empty-card"><h3>No events found</h3><p>Try another search or category.</p></div>';
    return;
  }

  events.forEach(function (event) {
    container.appendChild(createEventCard(event));
  });
}

// ------------------------------------------------------------
