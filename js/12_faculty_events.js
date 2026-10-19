// 12. FACULTY - MY EVENTS + EDIT
// ------------------------------------------------------------
function showMyEvents() {
  if (currentUser.role !== 'faculty') return;

  const myEvents = getEvents().filter(function (event) {
    return event.ownerEmail === currentUser.email;
  });

  app.innerHTML = `
    <p class="eyebrow">Faculty Dashboard</p>
    <h1 class="section-title">My Events</h1>
    <p class="section-subtitle">Manage events created by your faculty account.</p>
    <div class="stats-grid"><div><small>MY EVENTS</small><strong>${myEvents.length}</strong></div><div><small>PASSES BOOKED</small><strong>${myEvents.reduce((total, event) => total + event.booked, 0)}</strong></div><div><small>UPCOMING</small><strong>${myEvents.filter(isBookable).length}</strong></div></div>
    <div class="event-grid" id="myEventList"></div>`;

  const list = document.getElementById('myEventList');

  if (myEvents.length === 0) {
    list.innerHTML = `
      <div class="empty-card">
        <h3>No events posted yet</h3>
        <p>Create your first event for students.</p>
        <button class="primary-button" data-page="post">Post Event</button>
      </div>`;
    return;
  }

  myEvents.forEach(function (event) {
    const card = createEventCard(event);

    const editButton = document.createElement('button');
    editButton.className = 'secondary-button';
    editButton.style.width = '100%';
    editButton.style.marginTop = '10px';
    editButton.textContent = 'Edit Event';
    editButton.addEventListener('click', function () {
      showEditEvent(event.id);
    });

    card.querySelector('.event-body').appendChild(editButton);
    editButton.disabled = event.status === 'cancelled';
    const attendees = document.createElement('button');
    attendees.className = 'secondary-button'; attendees.textContent = 'Attendees & check-in';
    attendees.addEventListener('click', function () { showAttendees(event.id); });
    card.querySelector('.event-body').appendChild(attendees);
    if (isBookable(event)) {
      const cancel = document.createElement('button'); cancel.className = 'danger-button'; cancel.textContent = 'Cancel event';
      cancel.addEventListener('click', function () { showCancelEvent(event.id); });
      card.querySelector('.event-body').appendChild(cancel);
    }
    const deleteButton = document.createElement('button');
    deleteButton.className = 'danger-button';
    deleteButton.textContent = 'Delete Event';
    deleteButton.addEventListener('click', async function () {
      if (!confirm('Delete this event? Events with active bookings cannot be deleted.')) return;
      try {
        await api('/events/' + event.id, 'DELETE');
        await refreshData();
        showToast('Event deleted.');
        showMyEvents();
      } catch (error) { showToast(error.message, true); }
    });
    card.querySelector('.event-body').appendChild(deleteButton);
    list.appendChild(card);
  });
}

function showEditEvent(id) {
  const event = findEvent(id);

  if (!event || event.ownerEmail !== currentUser.email) {
    showToast('You can edit only your own events.', true);
    showMyEvents();
    return;
  }

  app.innerHTML = `
    <section class="form-card">
      <button class="secondary-button" data-page="my-events">← My Events</button>
      <p class="eyebrow" style="margin-top:22px">Faculty Dashboard</p>
      <h1 class="section-title">Edit Event</h1>
      <form id="editEventForm">
        ${eventFormHtml(event)}
        <button class="primary-button" type="submit">Save Changes</button>
      </form>
    </section>`;

  document.getElementById('eventCategory').value = event.category;

  document.getElementById('editEventForm').addEventListener('submit', async function (formEvent) {
    formEvent.preventDefault();

    const data = readEventForm();
    const error = document.getElementById('postError');
    const message = validateEventForm(data, event.booked);

    if (message) {
      error.textContent = message;
      return;
    }

    const button = formEvent.target.querySelector('button[type="submit"]');
    button.disabled = true;
    try {
      await api('/events/' + event.id, 'PUT', data);
      await refreshData();
      showToast('Event updated.');
      showMyEvents();
    } catch (failure) { error.textContent = failure.message; }
    button.disabled = false;
  });
}
