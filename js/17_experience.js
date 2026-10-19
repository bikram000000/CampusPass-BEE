// Organizer and account screens: ordinary DOM events, forms and Fetch API.
async function showAttendees(id) {
  const event = findEvent(id);
  let attendees;
  try { attendees = await api('/events/' + id + '/attendees'); } catch (error) { showToast(error.message, true); return; }
  const active = attendees.filter(ticket => ticket.status === 'active');
  window.scrollTo(0, 0);
  app.innerHTML = `<button class="secondary-button" data-page="my-events">← My events</button><p class="eyebrow" style="margin-top:24px">ORGANIZER DESK</p><h1 class="section-title">${escapeText(event.title)}</h1><p class="section-subtitle">Search by booking reference, name or student ID. Check-in admits the entire group.</p><div class="stats-grid"><div><small>ACTIVE PASSES</small><strong>${active.reduce((sum, ticket) => sum + ticket.quantity, 0)}</strong></div><div><small>CHECKED IN</small><strong>${active.filter(ticket => ticket.checkedIn).reduce((sum, ticket) => sum + ticket.quantity, 0)}</strong></div><div><small>DEMO SALES</small><strong>${money(active.reduce((sum, ticket) => sum + ticket.total, 0))}</strong></div></div><label>Find a booking<input id="attendeeSearch" placeholder="Booking reference, name or student ID"></label><div class="table-scroll"><table class="attendee-table"><thead><tr><th>Booking</th><th>Student</th><th>Passes</th><th>Status</th><th>Entry</th></tr></thead><tbody id="attendees"></tbody></table></div><p class="upload-note">Manual check-in for a classroom demonstration. Demo sales are not real revenue.</p>`;
  function render() {
    const search = document.getElementById('attendeeSearch').value.toLowerCase().trim();
    const rows = attendees.filter(ticket => (ticket.ticketId + ' ' + ticket.userName + ' ' + ticket.studentId).toLowerCase().includes(search));
    const body = document.getElementById('attendees'); body.innerHTML = '';
    if (!rows.length) { body.innerHTML = '<tr><td colspan="5">No matching bookings.</td></tr>'; return; }
    rows.forEach(function (ticket) {
      const row = document.createElement('tr');
      row.innerHTML = `<td><b>${ticket.ticketId}</b><br><small>${escapeText(ticket.email)}</small></td><td>${escapeText(ticket.userName)}<br><small>${escapeText(ticket.studentId)}</small></td><td>${ticket.quantity}</td><td>${ticket.status === 'cancelled' ? 'Cancelled' : ticket.checkedIn ? 'Checked in' : 'Not checked in'}</td><td></td>`;
      if (ticket.status === 'active' && !ticket.checkedIn && event.status !== 'cancelled') {
        const button = document.createElement('button'); button.className = 'secondary-button'; button.textContent = 'Check in group';
        button.addEventListener('click', async function () {
          button.disabled = true;
          try { const result = await api('/events/' + id + '/check-in', 'POST', { ticketId: ticket.ticketId }); showToast(result.message); await showAttendees(id); } catch (error) { showToast(error.message, true); button.disabled = false; }
        });
        row.lastElementChild.appendChild(button);
      }
      body.appendChild(row);
    });
  }
  document.getElementById('attendeeSearch').addEventListener('input', render); render();
}
function showCancelEvent(id) {
  const event = findEvent(id);
  window.scrollTo(0, 0);
  app.innerHTML = `<section class="form-card"><p class="eyebrow">ORGANIZER DESK</p><h1 class="section-title">Cancel this event?</h1><h2>${escapeText(event.title)}</h2><p>All active bookings will be cancelled. Students will see your reason in their booking history. This cannot be undone.</p><form id="cancelEventForm"><label>Reason<textarea id="cancelReason" required minlength="5" maxlength="300" placeholder="Tell your attendees what happened."></textarea></label><p class="error" id="cancelError" role="alert"></p><div class="button-row"><button class="secondary-button" type="button" data-page="my-events">Keep event</button><button class="danger-button" type="submit">Cancel event & bookings</button></div></form></section>`;
  document.getElementById('cancelEventForm').addEventListener('submit', async function (click) {
    click.preventDefault(); const button = click.target.querySelector('button[type="submit"]'); button.disabled = true;
    try { await api('/events/' + id + '/cancel', 'POST', { reason: document.getElementById('cancelReason').value.trim() }); await refreshData(); showMyEvents(); showToast('Event and active bookings cancelled.'); } catch (error) { document.getElementById('cancelError').textContent = error.message; button.disabled = false; }
  });
}
function showAccount() {
  window.scrollTo(0, 0);
  app.innerHTML = `<section class="form-card"><p class="eyebrow">YOUR CAMPUSPASS</p><h1 class="section-title">Hey, ${escapeText(currentUser.name)}.</h1><p>${escapeText(currentUser.email)} · ${escapeText(currentUser.role)}</p><form id="accountForm"><label>Full name<input id="profileName" required minlength="2" maxlength="80" value="${escapeText(currentUser.name)}"></label><label>Course / department<input id="profileDepartment" required maxlength="80" value="${escapeText(currentUser.department)}"></label><p id="accountMessage" role="status"></p><button class="primary-button">Save profile</button></form><hr><p>Your email and role identify your account and cannot be changed here.</p><button class="secondary-button" data-page="help">Help & booking policies</button></section>`;
  document.getElementById('accountForm').addEventListener('submit', async function (click) {
    click.preventDefault(); const button = click.target.querySelector('button'); button.disabled = true;
    try { const result = await api('/profile', 'PUT', { name: document.getElementById('profileName').value.trim(), department: document.getElementById('profileDepartment').value.trim() }); currentUser = result.user; showAccount(); showToast('Profile updated.'); } catch (error) { document.getElementById('accountMessage').textContent = error.message; button.disabled = false; }
  });
}
function showHelp() {
  const questions = [
    ['How do I book?', 'Choose an event, select 1–4 general admission passes, enter student details, review the total and confirm. You can have one active booking per event.'],
    ['Do I need to pay?', 'No. This version is a classroom demo. Listed prices, the CAMPUS10 offer and checkout totals are simulated. We never collect card or bank details.'],
    ['How do I enter?', 'Open My Bookings and show your pass and campus ID at the venue. All guests enter together. Faculty can verify the booking reference and check in your group.'],
    ['Can I cancel?', 'You can cancel the entire booking before the event begins and before check-in. All passes are released. No real money was charged, so there is no real refund.'],
    ['What if the organizer cancels or updates an event?', 'Cancelled bookings show the reason in My Bookings. Date, time and venue changes appear on existing passes after refresh. There are no email or push alerts in this version.'],
    ['Where is my data stored?', 'Accounts, events, bookings and sessions are held in server memory and reset on server restart. Your wishlist and sort preference stay in this browser; unfinished booking details stay in the current browser tab until logout.'],
    ['Can I choose a seat?', 'This version uses general admission. Reserved seating and timed seat holds are planned for a later backend stage.'],
    ['Need event-specific help?', 'Check the organizer and venue on the event details screen and contact your campus activities office. This demo does not send support messages.']
  ];
  window.scrollTo(0, 0);
  app.innerHTML = `<section class="help-page"><p class="eyebrow">WE'VE GOT THE BASICS COVERED</p><h1 class="section-title">A little help, before you go.</h1>${questions.map(item => '<details class="faq"><summary>' + item[0] + '</summary><p>' + item[1] + '</p></details>').join('')}<button class="primary-button" data-page="events">Back to exploring</button></section>`;
}
