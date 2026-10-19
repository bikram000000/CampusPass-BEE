function ticketStatus(ticket) {
  if (ticket.status === 'cancelled') return 'Cancelled';
  if (ticket.checkedIn) return 'Checked in';
  return new Date(ticket.date + 'T' + ticket.time) <= new Date() ? 'Past' : 'Upcoming';
}
function showTicket(ticket, isNew) {
  const status = ticketStatus(ticket);
  window.scrollTo(0, 0);
  app.innerHTML = `<section class="ticket"><div class="ticket-head"><p class="eyebrow">CAMPUSPASS / GENERAL ADMISSION</p><h2>${isNew ? "You're going!" : 'Your campus pass'}</h2><p>${status === 'Cancelled' ? 'This ticket is not valid for entry.' : 'Bring your campus ID. Your group enters together.'}</p></div><div class="ticket-body"><div><span class="status ${status === 'Cancelled' ? 'cancelled' : ''}">${status}</span><h2>${escapeText(ticket.eventTitle)}</h2><p>${formatDate(ticket.date)} · ${ticket.time}</p><p>${escapeText(ticket.venue)}</p><p><b>${escapeText(ticket.userName)}</b> · ${ticket.quantity} ${ticket.quantity === 1 ? 'pass' : 'passes'}</p><p class="ticket-id">${ticket.ticketId}</p><p>${escapeText(ticket.cancelReason || 'Present this booking reference at the entrance.')}</p></div><div class="ticket-symbol" aria-hidden="true">✳</div></div><div class="receipt"><div class="price-line"><span>Passes</span><b>${money(ticket.subtotal)}</b></div><div class="price-line"><span>Offer ${escapeText(ticket.coupon || '—')}</span><b>−${money(ticket.discount)}</b></div><div class="price-line total"><span>Demo total</span><b>${money(ticket.total)}</b></div><small>Simulated transaction. No money charged or refunded.</small></div></section><div class="button-row" style="justify-content:center"><button class="secondary-button" id="printTicket">Print / Save as PDF</button><button class="primary-button" data-page="tickets">My bookings</button></div>`;
  document.getElementById('printTicket').addEventListener('click', () => window.print());
}
function showTickets() {
  window.scrollTo(0, 0);
  app.innerHTML = `<p class="eyebrow">YOUR PLANS, IN ONE PLACE</p><h1 class="section-title">My bookings</h1><p class="section-subtitle">Your passes, booking history and the memories still to come.</p><div class="booking-tabs" id="bookingTabs"></div><div id="ticketList"></div>`;
  function render(filter) {
    const list = document.getElementById('ticketList'); list.innerHTML = '';
    document.querySelectorAll('#bookingTabs button').forEach(button => button.classList.toggle('active', button.textContent === filter));
    const tickets = getTickets().filter(ticket => filter === 'All' || ticketStatus(ticket) === filter).slice().reverse();
    if (!tickets.length) { list.innerHTML = '<div class="empty-card"><h3>No bookings in this view</h3><p>Your next experience is waiting.</p><button class="primary-button" data-page="events">Discover events</button></div>'; return; }
    tickets.forEach(function (ticket) {
      const status = ticketStatus(ticket); const card = document.createElement('section'); card.className = 'booking-row';
      card.innerHTML = `<div class="date-block"><b>${new Date(ticket.date + 'T00:00:00').getDate()}</b><span>${new Date(ticket.date + 'T00:00:00').toLocaleDateString('en-IN', { month:'short' })}</span></div><div class="booking-info"><span class="status ${status === 'Cancelled' ? 'cancelled' : ''}">${status}</span><h2>${escapeText(ticket.eventTitle)}</h2><p>${escapeText(ticket.venue)} · ${ticket.time}</p><small>${ticket.ticketId} · ${ticket.quantity} passes · ${money(ticket.total)} demo total</small></div><div class="booking-actions"><button class="primary-button" data-view-ticket="${ticket.ticketId}">View pass</button>${status === 'Upcoming' ? '<button class="danger-button" data-cancel-ticket="' + ticket.ticketId + '">Cancel booking</button>' : ''}</div>`;
      card.querySelector('[data-view-ticket]').addEventListener('click', () => showTicket(ticket, false));
      const cancel = card.querySelector('[data-cancel-ticket]'); if (cancel) cancel.addEventListener('click', () => cancelTicket(ticket.ticketId));
      list.appendChild(card);
    });
  }
  ['All','Upcoming','Checked in','Past','Cancelled'].forEach(function (status) { const button = document.createElement('button'); button.className = 'category-chip'; button.textContent = status; button.addEventListener('click', () => render(status)); document.getElementById('bookingTabs').appendChild(button); });
  render('All');
}
async function cancelTicket(id) {
  if (!confirm('Cancel this entire booking and release all its passes? No real money was charged.')) return;
  try { await api('/tickets/' + id, 'DELETE'); await refreshData(); showTickets(); showToast('Booking cancelled. All passes released.'); } catch (error) { showToast(error.message, true); }
}
