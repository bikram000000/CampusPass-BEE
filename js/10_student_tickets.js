// 10. STUDENT TICKETS + CANCELLATION
// ------------------------------------------------------------
function showTicket(ticket, isNew) {
  app.innerHTML = `
    <section class="ticket">
      <div class="ticket-head">
        <h2>${isNew ? "You're Registered!" : 'Digital Ticket'}</h2>
        <p>Keep this ticket for event entry.</p>
      </div>
      <div class="ticket-body">
        <div>
          <h3>${escapeText(ticket.eventTitle)}</h3>
          <p><b>${escapeText(ticket.userName)}</b></p>
          <p>${formatDate(ticket.date)} · ${ticket.time}</p>
          <p>${escapeText(ticket.venue)}</p>
          <p class="ticket-id">Ticket ID: ${ticket.ticketId}</p>
          <span class="status">ACTIVE</span>
        </div>
        <div class="ticket-symbol">🎟️</div>
      </div>
    </section>
    <div class="button-row" style="justify-content:center">
      <button class="secondary-button" id="printTicket">Print Ticket</button>
      <button class="primary-button" data-page="tickets">My Tickets</button>
    </div>`;

  document.getElementById('printTicket').addEventListener('click', function () {
    window.print();
  });
}

function showTickets() {
  const myTickets = getTickets().filter(function (ticket) {
    return ticket.email === currentUser.email;
  });

  app.innerHTML = `
    <p class="eyebrow">Student Dashboard</p>
    <h1 class="section-title">My Tickets</h1>
    <p class="section-subtitle">Your registrations are stored in this browser.</p>
    <div id="ticketList"></div>`;

  const list = document.getElementById('ticketList');

  if (myTickets.length === 0) {
    list.innerHTML = `
      <div class="empty-card">
        <h3>No tickets yet</h3>
        <p>Apply for an event and your digital ticket will appear here.</p>
        <button class="primary-button" data-page="events">Browse Events</button>
      </div>`;
    return;
  }

  myTickets.forEach(function (ticket) {
    const eventDate = new Date(ticket.date + 'T00:00:00');
    const past = eventDate < new Date();
    const cancelled = ticket.status === 'cancelled';
    const statusText = cancelled ? 'CANCELLED' : (past ? 'PAST EVENT' : 'ACTIVE');

    const ticketCard = document.createElement('section');
    ticketCard.className = 'ticket';
    ticketCard.innerHTML = `
      <div class="ticket-head">
        <h2>${escapeText(ticket.eventTitle)}</h2>
        <p>${statusText}</p>
      </div>
      <div class="ticket-body">
        <div>
          <p><b>${escapeText(ticket.userName)}</b></p>
          <p>${formatDate(ticket.date)} · ${ticket.time}</p>
          <p>${escapeText(ticket.venue)}</p>
          <p class="ticket-id">Ticket ID: ${ticket.ticketId}</p>
          <span class="status ${cancelled ? 'cancelled' : ''}">${statusText}</span>
        </div>
        <div class="ticket-symbol">🎟️</div>
      </div>`;

    const buttons = document.createElement('div');
    buttons.className = 'button-row';
    buttons.style.padding = '0 24px 23px';

    const viewButton = document.createElement('button');
    viewButton.className = 'secondary-button';
    viewButton.textContent = 'View Ticket';
    viewButton.addEventListener('click', function () {
      showTicket(ticket, false);
    });
    buttons.appendChild(viewButton);

    if (!cancelled && !past) {
      const cancelButton = document.createElement('button');
      cancelButton.className = 'danger-button';
      cancelButton.textContent = 'Cancel Registration';
      cancelButton.addEventListener('click', function () {
        cancelTicket(ticket.ticketId);
      });
      buttons.appendChild(cancelButton);
    }

    ticketCard.appendChild(buttons);
    list.appendChild(ticketCard);
  });
}

function cancelTicket(ticketId) {
  const tickets = getTickets();
  const ticket = tickets.find(function (item) {
    return item.ticketId === ticketId;
  });

  if (!ticket || ticket.status !== 'active') return;

  ticket.status = 'cancelled';
  saveTickets(tickets);

  const events = getEvents();
  const event = events.find(function (item) {
    return item.id === ticket.eventId;
  });

  if (event && event.booked > 0) {
    event.booked--;
  }

  saveEvents(events);
  showToast('Registration cancelled and seat restored.');
  showTickets();
}

// ------------------------------------------------------------
